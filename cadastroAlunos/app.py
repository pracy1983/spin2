from flask import Flask, request, jsonify, render_template, send_from_directory, redirect, url_for, flash
from datetime import datetime
import os
from PIL import Image
import json
from supabase import create_client, Client
from dotenv import load_dotenv
import gspread
from google.oauth2.credentials import Credentials
from google.oauth2.service_account import Credentials
from urllib.parse import urlparse
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import csv
import io
from difflib import SequenceMatcher
from werkzeug.utils import secure_filename
import re
import uuid
from datetime import timedelta
from flask_login import login_required, current_user
from auth import auth, init_login, init_mail, role_required

print("Iniciando a aplicação...")  # Mensagem de debug

# Configuração do Flask com static_folder
app = Flask(__name__, static_url_path='/static', static_folder='static')
app.secret_key = os.getenv('SECRET_KEY', 'sua-chave-secreta-aqui')  # Adicione uma chave secreta

# Registrar o blueprint de autenticação
app.register_blueprint(auth)

# Inicializar login manager e email
init_login(app)
init_mail(app)

# Configuração da pasta de uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
print(f"UPLOAD_FOLDER configurado como: {UPLOAD_FOLDER}")  # Debug

# Carregar variáveis de ambiente
load_dotenv()
print("Variáveis de ambiente carregadas")  # Mensagem de debug

# Configuração do Supabase
print("Tentando conectar ao Supabase...")  # Mensagem de debug
supabase: Client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_ANON_KEY')
)
print("Conexão com Supabase estabelecida")  # Mensagem de debug

def processar_foto(filepath):
    try:
        from PIL import Image
        
        # Abrir a imagem
        with Image.open(filepath) as img:
            # Converter para RGB se necessário
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calcular proporção 3x4
            width, height = img.size
            if width/height > 3/4:  # Imagem mais larga que 3:4
                new_width = int(height * (3/4))
                left = (width - new_width) // 2
                img = img.crop((left, 0, left + new_width, height))
            else:  # Imagem mais alta que 3:4
                new_height = int(width * (4/3))
                top = (height - new_height) // 2
                img = img.crop((0, top, width, top + new_height))
            
            # Redimensionar para um tamanho padrão (por exemplo, 300x400)
            img = img.resize((300, 400), Image.Resampling.LANCZOS)
            
            return img
            
    except Exception as e:
        print(f"Erro ao processar imagem: {str(e)}")
        return None

def extract_sheet_id(url):
    """Extrai o ID da planilha do Google Sheets a partir da URL."""
    try:
        if '/spreadsheets/d/' in url:
            # Format: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
            sheet_id = url.split('/spreadsheets/d/')[1].split('/')[0]
        elif 'key=' in url:
            # Format: https://docs.google.com/spreadsheets/d/e/KEY/pubhtml
            sheet_id = url.split('key=')[1].split('&')[0]
        else:
            raise ValueError("URL inválida da planilha")
        return sheet_id
    except Exception as e:
        raise ValueError("Não foi possível extrair o ID da planilha da URL fornecida")

def get_google_sheets_credentials():
    """Configura as credenciais do Google Sheets usando OAuth2."""
    try:
        # Carregar credenciais do arquivo client_secret.json
        flow = InstalledAppFlow.from_client_secrets_file(
            'client_secret.json',
            scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
        )
        
        # Usar credenciais em cache se disponíveis
        creds = None
        if os.path.exists('token.json'):
            creds = Credentials.from_authorized_user_file('token.json')
            
        # Se não houver credenciais válidas, fazer login
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                creds = flow.run_local_server(port=0)
            
            # Salvar credenciais para uso futuro
            with open('token.json', 'w') as token:
                token.write(creds.to_json())
                
        return creds
    except Exception as e:
        print(f"Erro ao obter credenciais: {str(e)}")
        raise

def match_header(header, valid_headers):
    """Encontra o cabeçalho mais similar usando uma combinação de técnicas"""
    header = header.lower().strip()
    
    # Dicionário de sinônimos e variações comuns
    synonyms = {
        'nome': ['nome completo', 'aluno', 'estudante', 'participante', 'membro', 'nome do aluno'],
        'email': ['e-mail', 'correio', 'correio eletrônico', 'endereço de email', 'mail'],
        'telefone': ['tel', 'fone', 'celular', 'contato', 'whatsapp', 'número', 'telefone celular'],
        'templo': ['loja', 'local', 'unidade', 'sede'],
        'data_nascimento': ['nascimento', 'data nasc', 'dt nasc', 'dt nascimento', 'data de nasc', 'aniversário'],
        'data_iniciacao': ['iniciacao', 'data inic', 'dt iniciacao', 'inicio', 'data inicio', 'data de inicio'],
        'data_elevacao': ['elevacao', 'data elev', 'dt elevacao', 'data de elevacao'],
        'data_exaltacao': ['exaltacao', 'data exalt', 'dt exaltacao', 'data de exaltacao'],
        'data_instalacao': ['instalacao', 'data inst', 'dt instalacao', 'data de instalacao'],
        'data_iniciacao_mestre': ['iniciacao mestre', 'data inic mestre', 'dt iniciacao mestre', 'mestre']
    }
    
    # Primeiro, tenta encontrar correspondência exata
    for valid_header, variations in synonyms.items():
        if header == valid_header or header in variations:
            return valid_header
            
    # Se não encontrou correspondência exata, usa similaridade de texto
    from difflib import SequenceMatcher
    
    best_match = None
    best_ratio = 0
    
    for valid_header, variations in synonyms.items():
        # Verificar o cabeçalho principal
        ratio = SequenceMatcher(None, header, valid_header).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_match = valid_header
            
        # Verificar as variações
        for variation in variations:
            ratio = SequenceMatcher(None, header, variation).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_match = valid_header
                
    # Só retorna se a similaridade for maior que 0.6 (60% similar)
    if best_ratio > 0.6:
        return best_match
        
    return None

_cpf_counter = 0

def gerar_cpf_temporario():
    """Gera um CPF temporário único usando um contador global"""
    global _cpf_counter
    _cpf_counter += 1
    # Usa o contador para gerar um CPF único
    cpf_temp = str(_cpf_counter).zfill(11)
    return cpf_temp

def format_date(date_str):
    """Formata uma data ISO para o formato brasileiro (dd/mm/yyyy)"""
    if not date_str:
        return None
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        return date_obj.strftime('%d/%m/%Y')
    except:
        return None

@app.route('/')
@login_required
def index():
    return redirect(url_for('lista_alunos'))

@app.route('/lista_alunos')
@login_required
def lista_alunos():
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
    response = supabase.table('alunos').select("*").execute()
    alunos = response.data
    
    # Format dates as dd/mm/yyyy
    date_fields = [
        'data_nascimento',
        'data_inicio_desenvolvimento',
        'data_inicio_estagio',
        'data_iniciacao_magista',
        'data_inicio_not',
        'data_iniciacao_mestre'
    ]
    
    for aluno in alunos:
        for field in date_fields:
            if aluno.get(field):
                try:
                    date_obj = datetime.strptime(aluno[field], '%Y-%m-%d')
                    aluno[field] = date_obj.strftime('%d/%m/%Y')
                except (ValueError, TypeError):
                    continue
    
    return render_template('lista_alunos.html', alunos=alunos)

@app.route('/lista_convidados')
@login_required
def lista_convidados():
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
    response = supabase.table('convidados').select("*").execute()
    convidados = response.data
    return render_template('lista_convidados.html', convidados=convidados)

@app.route('/cadastro_aluno')
@login_required
@role_required(['owner', 'admin'])
def cadastro_aluno():
    return render_template('cadastro_aluno.html')

@app.route('/importar_dados')
@login_required
@role_required(['owner', 'admin'])
def importar_dados():
    return render_template('importar_dados.html')

@app.route('/uploads/<path:filename>')
@login_required
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/alunos', methods=['GET'])
@login_required
def get_alunos():
    try:
        # Get filter parameters from URL
        search = request.args.get('search', '').lower()
        temple = request.args.get('temple', 'todos')
        status = request.args.get('status', 'todos')
        
        # Fetch all students
        response = supabase.table('alunos').select('*').execute()
        alunos = response.data

        # Add photo URL for each student
        for aluno in alunos:
            if aluno.get('foto_path'):
                aluno['foto_url'] = url_for('uploaded_file', filename=aluno['foto_path'], _external=True)
            else:
                aluno['foto_url'] = None

            # Se o campo inativo não existir, define como False (ativo)
            if 'inativo' not in aluno:
                aluno['inativo'] = False

        # Apply filters
        filtered_alunos = []
        for aluno in alunos:
            # Search filter
            matches_search = (
                search == '' or
                search in aluno.get('nome', '').lower() or
                search in aluno.get('email', '').lower()
            )

            # Temple filter based on state
            aluno_temple = 'bh' if aluno.get('estado') == 'MG' else 'sp'
            matches_temple = temple == 'todos' or temple.lower() == aluno_temple

            # Status filter
            matches_status = (
                status == 'todos' or
                (status == 'ativos' and not aluno['inativo']) or
                (status == 'inativos' and aluno['inativo'])
            )

            if matches_search and matches_temple and matches_status:
                filtered_alunos.append(aluno)

        return jsonify(filtered_alunos)

    except Exception as e:
        print(f"Erro ao buscar alunos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/aluno', methods=['POST'])
@login_required
@role_required(['owner', 'admin'])
def criar_aluno():
    try:
        print("Dados recebidos do formulário:", request.form)  # Novo log
        print("Arquivos recebidos:", request.files)  # Novo log
        
        # Processar o valor do checkbox fundador
        fundador_value = request.form.get('fundador')
        is_fundador = bool(fundador_value and fundador_value.lower() in ['1', 'true', 'on'])
        
        dados = {
            'nome': request.form.get('nome', '').strip(),
            'email': request.form.get('email', '').strip(),
            'telefone': request.form.get('telefone', '').strip(),
            'cpf': request.form.get('cpf', '').strip(),
            'rg': request.form.get('rg', '').strip(),
            'data_nascimento': None,  # Será processado abaixo
            'endereco': request.form.get('endereco', '').strip(),
            'religiao': request.form.get('religiao', '').strip(),
            'unidade': request.form.get('unidade', '').strip(),
            'fundador': is_fundador,
            'inativo': False,  # Definindo todos os alunos como ativos por padrão
            'data_inicio_desenvolvimento': None,  # Será processado abaixo
            'data_inicio_estagio': None,  # Será processado abaixo
            'data_iniciacao_magista': None,  # Será processado abaixo
            'data_inicio_not': None,  # Será processado abaixo
            'data_iniciacao_mestre': None,  # Será processado abaixo
            'observacoes': request.form.get('observacoes', '').strip()
        }
        
        # Processar datas
        date_fields = [
            'data_nascimento',
            'data_inicio_desenvolvimento',
            'data_inicio_estagio',
            'data_iniciacao_magista',
            'data_inicio_not',
            'data_iniciacao_mestre'
        ]
        
        for field in date_fields:
            value = request.form.get(field, '').strip()
            if value:
                try:
                    # Tentar primeiro YYYY-MM-DD
                    date_obj = datetime.strptime(value, '%Y-%m-%d')
                    dados[field] = date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    try:
                        # Tentar DD/MM/YYYY
                        date_obj = datetime.strptime(value, '%d/%m/%Y')
                        dados[field] = date_obj.strftime('%Y-%m-%d')
                    except ValueError:
                        print(f"Erro ao processar data {field}: {value}")
                        dados[field] = None
            else:
                dados[field] = None
        
        # Remover campos vazios, mas manter datas mesmo que sejam None
        dados = {k: v for k, v in dados.items() if k in date_fields or v not in [None, '']}
        
        print("Dados processados para salvar:", dados)  # Debug
        
        # Processar foto se enviada
        if 'foto' in request.files:
            foto = request.files['foto']
            if foto:
                filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                foto.save(filepath)
                
                # Processar a foto para formato 3x4
                processed_image = processar_foto(filepath)
                if processed_image:
                    processed_filename = f"3x4_{filename}"
                    processed_filepath = os.path.join(app.config['UPLOAD_FOLDER'], processed_filename)
                    processed_image.save(processed_filepath, 'JPEG')
                    dados['foto_path'] = processed_filename
                else:
                    return jsonify({'error': 'Erro ao processar a imagem'}), 400

        print(f"Dados a serem salvos: {dados}")  # Debug
        response = supabase.table('alunos').insert(dados).execute()
        
        if not response.data:
            return jsonify({'error': 'Erro ao criar aluno'}), 500
            
        return jsonify(response.data[0])
        
    except Exception as e:
        print(f"Erro ao criar aluno: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/aluno/<id>', methods=['DELETE'])
@login_required
@role_required(['owner'])
def deletar_aluno(id):
    try:
        # Primeiro, vamos buscar o aluno para ter certeza que ele existe
        response = supabase.table('alunos').select('*').eq('id', id).execute()
        if not response.data:
            return jsonify({'error': 'Aluno não encontrado'}), 404
            
        aluno = response.data[0]
        
        # Se o aluno tem uma foto, vamos excluí-la
        if aluno.get('foto_path'):
            foto_path = os.path.join(app.config['UPLOAD_FOLDER'], aluno['foto_path'])
            if os.path.exists(foto_path):
                os.remove(foto_path)
        
        # Excluir o aluno do banco de dados
        supabase.table('alunos').delete().eq('id', id).execute()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"Erro ao excluir aluno: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/aluno/<id>', methods=['GET'])
@login_required
def obter_aluno(id):
    try:
        print(f"Tentando obter aluno com ID: {id}")
        
        # Primeiro, verificar se o ID é válido
        if not id:
            print("ID inválido")
            return jsonify({'error': 'ID inválido'}), 400
            
        # Converter ID para inteiro
        try:
            id_int = int(id)
        except ValueError:
            print("ID não é um número válido")
            return jsonify({'error': 'ID inválido'}), 400
            
        # Buscar aluno com todas as informações
        print("Executando query no Supabase...")
        response = supabase.table('alunos').select('*').eq('id', id_int).execute()
        
        print(f"Resposta do Supabase: {response}")
        
        if not response.data:
            print(f"Aluno não encontrado com ID: {id}")
            return jsonify({'error': 'Aluno não encontrado'}), 404
            
        aluno = response.data[0]
        print(f"Dados do aluno encontrados: {aluno}")
        
        # Garantir que todos os campos existam, mesmo que vazios
        campos_padrao = {
            'nome': '',
            'email': '',
            'telefone': '',
            'cpf': '',
            'rg': '',
            'data_nascimento': '',
            'endereco': '',
            'cidade': '',
            'estado': '',
            'cep': '',
            'unidade': '',
            'religiao': '',
            'fundador': False,
            'data_inicio_desenvolvimento': '',
            'data_inicio_estagio': '',
            'data_iniciacao_magista': '',
            'data_inicio_not': '',
            'data_iniciacao_mestre': '',
            'observacoes': '',
            'foto_path': '',
            'frequencia_desenvolvimento': [],
            'frequencia_trabalho': [],
            'mensalidades': []
        }
        
        # Mesclar dados do banco com campos padrão
        dados_completos = {**campos_padrao, **aluno}
        
        # Verificar se existe foto e gerar URL completa
        if dados_completos.get('foto_path'):
            dados_completos['foto_url'] = url_for('uploaded_file', filename=dados_completos['foto_path'], _external=True)
        else:
            dados_completos['foto_url'] = None
            
        print(f"Dados completos a serem retornados: {dados_completos}")
        
        return jsonify(dados_completos)
        
    except Exception as e:
        print(f"Erro ao obter aluno: {str(e)}")
        print(f"Tipo do erro: {type(e)}")
        import traceback
        print(f"Traceback completo: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/aluno/<id>', methods=['PUT'])
@login_required
@role_required(['owner', 'admin'])
def atualizar_aluno(id):
    try:
        dados = request.get_json()
        print("Dados a serem atualizados:", dados)
        
        # Atualizar o aluno no Supabase
        response = supabase.table('alunos').update(dados).eq('id', id).execute()
        print("Resposta do Supabase:", response.data)
        
        if response.data:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Erro ao atualizar aluno'}), 400
            
    except Exception as e:
        print(f"Erro ao atualizar aluno: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/aluno/<id>/frequencia', methods=['GET', 'POST'])
@login_required
def frequencia_aluno(id):
    return jsonify({'success': True}), 200

@app.route('/toggle_frequencia/<id>', methods=['POST'])
@login_required
def toggle_frequencia(id):
    try:
        data = request.json
        if not data or 'data' not in data or 'tipo' not in data:
            return jsonify({'error': 'Dados inválidos'}), 400

        data_evento = data['data']
        tipo_evento = data['tipo']

        # Buscar aluno
        response = supabase.table('alunos').select('*').eq('id', id).execute()
        if not response.data:
            return jsonify({'error': 'Aluno não encontrado'}), 404
        
        aluno = response.data[0]
        
        # Inicializar lista de frequência se não existir
        if not aluno.get('frequencia_' + tipo_evento):
            aluno['frequencia_' + tipo_evento] = []

        # Verificar se a data já existe na lista
        if data_evento in aluno['frequencia_' + tipo_evento]:
            # Se existe, remover
            aluno['frequencia_' + tipo_evento].remove(data_evento)
            status = False
        else:
            # Se não existe, adicionar
            aluno['frequencia_' + tipo_evento].append(data_evento)
            status = True

        # Atualizar no banco de dados
        response = supabase.table('alunos').update({
            'frequencia_' + tipo_evento: aluno['frequencia_' + tipo_evento]
        }).eq('id', id).execute()

        if not response.data:
            return jsonify({'error': 'Erro ao atualizar frequência'}), 500

        return jsonify({
            'status': status,
            'message': 'Frequência atualizada com sucesso',
            'data': data_evento,
            'tipo': tipo_evento
        })

    except Exception as e:
        print(f"Erro ao atualizar frequência: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/aluno/<id>/foto', methods=['POST'])
@login_required
def atualizar_foto(id):
    try:
        if 'foto' not in request.files:
            return jsonify({'error': 'Nenhuma foto enviada'}), 400
            
        foto = request.files['foto']
        if foto.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
            
        if not foto or not allowed_file(foto.filename):
            return jsonify({'error': 'Tipo de arquivo não permitido'}), 400
            
        # Gera um nome único para o arquivo
        filename = secure_filename(foto.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # Cria o caminho do arquivo
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Salva o arquivo
        foto.save(filepath)
        
        # Atualiza o caminho da foto no banco de dados
        supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
        
        # Atualiza apenas o campo foto_path
        response = supabase.table('alunos').update({
            'foto_path': unique_filename
        }).eq('id', id).execute()
        
        if response.data:
            return jsonify({
                'success': True,
                'foto_path': unique_filename
            })
        else:
            # Se falhou ao atualizar o banco, remove o arquivo
            os.remove(filepath)
            return jsonify({'error': 'Erro ao atualizar foto no banco de dados'}), 500
            
    except Exception as e:
        print(f"Erro ao fazer upload da foto: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/aluno/<id>/status', methods=['GET'])
@login_required
def verificar_status(id):
    try:
        from datetime import datetime, timedelta
        
        # Buscar aluno
        response = supabase.table('alunos').select('*').eq('id', id).execute()
        if not response.data:
            return jsonify({'error': 'Aluno não encontrado'}), 404
        
        aluno = response.data[0]
        
        # Verificar últimas presenças
        hoje = datetime.now()
        tres_meses_atras = hoje - timedelta(days=90)
        
        # Converter para string no formato YYYY-MM-DD
        data_limite = tres_meses_atras.strftime('%Y-%m-%d')
        
        # Verificar frequências recentes
        frequencia_templo = aluno.get('frequencia_templo', [])
        mensalidades = aluno.get('mensalidades', [])
        
        tem_presenca_recente = any(data > data_limite for data in frequencia_templo)
        tem_mensalidade_recente = any(data > data_limite for data in mensalidades)
        
        ativo = tem_presenca_recente and tem_mensalidade_recente
        
        # Atualizar status no banco
        response = supabase.table('alunos').update({
            'ativo': ativo
        }).eq('id', id).execute()
        
        return jsonify({'ativo': ativo})

    except Exception as e:
        print(f"Erro ao verificar status: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/preview-import', methods=['POST'])
@login_required
@role_required(['owner', 'admin'])
def preview_import():
    try:
        data = request.get_json()
        sheet_url = data.get('url')
        
        if not sheet_url:
            return jsonify({'error': 'URL da planilha não fornecida'}), 400
        
        try:
            # Obter credenciais
            creds = get_google_sheets_credentials()
            
            # Criar cliente do Google Sheets
            service = build('sheets', 'v4', credentials=creds)
            
            # Extrair ID da planilha
            sheet_id = extract_sheet_id(sheet_url)
            
            # Obter dados da planilha
            result = service.spreadsheets().values().get(
                spreadsheetId=sheet_id,
                range='A1:Z1000'  # Ajuste o range conforme necessário
            ).execute()
            
            values = result.get('values', [])
            if not values:
                return jsonify({'error': 'Planilha vazia'}), 400
            
            # Pegar cabeçalhos
            headers = values[0]
            
            # Converter dados para lista de dicionários
            preview_data = []
            for row in values[1:]:  # Pular a linha de cabeçalho
                aluno = {}
                for i, value in enumerate(row):
                    if i < len(headers):  # Evitar erro se a linha tiver mais colunas que cabeçalhos
                        header = headers[i].strip()
                        # Mapear cabeçalhos para nomes de campos
                        field_map = {
                            'Nome': 'nome',
                            'Email': 'email',
                            'Telefone': 'telefone',
                            'Templo': 'templo',
                            'Data de Nascimento': 'data_nascimento',
                            'Data de Iniciação': 'data_iniciacao',
                            'Data de Elevação': 'data_elevacao',
                            'Data de Exaltação': 'data_exaltacao',
                            'Data de Instalação': 'data_instalacao',
                            'Data de Iniciação de Mestre': 'data_iniciacao_mestre'
                        }
                        field_name = field_map.get(header)
                        if field_name:
                            aluno[field_name] = value.strip() if value else ''
                
                preview_data.append(aluno)
            
            return jsonify(preview_data)
            
        except Exception as e:
            print(f"Erro ao processar planilha: {str(e)}")
            return jsonify({'error': str(e)}), 500
            
    except Exception as e:
        print(f"Erro ao preview dados: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/import', methods=['POST'])
@login_required
@role_required(['owner', 'admin'])
def import_data():
    try:
        data = request.get_json()
        sheet_url = data.get('url')
        
        if not sheet_url:
            return jsonify({'error': 'URL da planilha não fornecida'}), 400
            
        try:
            # Obter credenciais
            creds = get_google_sheets_credentials()
            
            # Criar cliente do Google Sheets
            service = build('sheets', 'v4', credentials=creds)
            
            # Extrair ID da planilha
            sheet_id = extract_sheet_id(sheet_url)
            
            # Obter dados da planilha
            result = service.spreadsheets().values().get(
                spreadsheetId=sheet_id,
                range='A1:Z1000'  # Ajuste o range conforme necessário
            ).execute()
            
            values = result.get('values', [])
            if not values:
                return jsonify({'error': 'Planilha vazia'}), 400
            
            # Pegar cabeçalhos
            headers = values[0]
            
            # Importar dados
            imported_count = 0
            for row in values[1:]:  # Pular a linha de cabeçalho
                try:
                    aluno_data = {}
                    for i, value in enumerate(row):
                        if i < len(headers):  # Evitar erro se a linha tiver mais colunas que cabeçalhos
                            header = headers[i].strip()
                            # Mapear cabeçalhos para nomes de campos
                            field_map = {
                                'Nome': 'nome',
                                'Email': 'email',
                                'Telefone': 'telefone',
                                'Templo': 'templo',
                                'Data de Nascimento': 'data_nascimento',
                                'Data de Iniciação': 'data_iniciacao',
                                'Data de Elevação': 'data_elevacao',
                                'Data de Exaltação': 'data_exaltacao',
                                'Data de Instalação': 'data_instalacao',
                                'Data de Iniciação de Mestre': 'data_iniciacao_mestre'
                            }
                            field_name = field_map.get(header)
                            if field_name:
                                aluno_data[field_name] = value.strip() if value else ''
                    
                    # Inserir no banco de dados
                    if aluno_data.get('nome'):  # Só importa se tiver pelo menos o nome
                        response = supabase.table('alunos').insert(aluno_data).execute()
                        if response.data:
                            imported_count += 1
                            
                except Exception as e:
                    print(f"Erro ao importar aluno {aluno_data.get('nome', 'desconhecido')}: {str(e)}")
                    continue
                    
        except Exception as e:
            print(f"Erro ao processar planilha: {str(e)}")
            return jsonify({'error': str(e)}), 500
            
        return jsonify({
            'message': f'{imported_count} alunos importados com sucesso',
            'imported_count': imported_count
        })
        
    except Exception as e:
        print(f"Erro ao importar dados: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/import-csv', methods=['POST'])
@login_required
@role_required(['owner', 'admin'])
def import_csv():
    try:
        print("Iniciando importação CSV...")
        
        if 'file' not in request.files:
            print("Nenhum arquivo encontrado na requisição")
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
            
        file = request.files['file']
        if file.filename == '':
            print("Nome do arquivo está vazio")
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
            
        if not file.filename.endswith('.csv'):
            print(f"Arquivo com extensão inválida: {file.filename}")
            return jsonify({'error': 'Por favor, envie um arquivo CSV'}), 400
            
        print(f"Arquivo recebido: {file.filename}")
        
        # Definir possíveis sinônimos para cada campo
        field_synonyms = {
            'nome': ['nome', 'name', 'aluno', 'estudante', 'student'],
            'email': ['email', 'e-mail', 'e_mail', 'correio', 'mail'],
            'telefone': ['telefone', 'tel', 'fone', 'celular', 'phone', 'mobile', 'whatsapp', 'contato'],
            'data_nascimento': ['data_nascimento', 'data nascimento', 'nascimento', 'birth', 'data de nascimento', 'aniversário', 'birthday'],
            'cpf': ['cpf', 'documento', 'doc', 'registro'],
            'rg': ['rg', 'identidade', 'registro geral'],
            'endereco': ['endereco', 'endereço', 'address', 'cidade', 'city', 'local', 'localidade'],
            'religiao': ['religiao', 'religião', 'religion']
        }
        
        # Ler o arquivo CSV
        text_stream = io.TextIOWrapper(file.stream, encoding='utf-8-sig')
        csv_reader = csv.reader(text_stream)
            
        # Pegar cabeçalhos
        headers = next(csv_reader)
        print(f"Cabeçalhos encontrados: {headers}")
        
        # Mapear cabeçalhos para os campos corretos
        header_mapping = {}
        for i, header in enumerate(headers):
            header_lower = header.lower().strip()
            
            # Tentar encontrar o campo correspondente usando sinônimos
            for field, synonyms in field_synonyms.items():
                if any(syn in header_lower for syn in synonyms):
                    header_mapping[i] = field
                    break
            
            print(f"Cabeçalho '{header}' mapeado para: {header_mapping.get(i, 'não mapeado')}")
            
        # Importar dados
        imported_count = 0
        for row in csv_reader:
            try:
                print(f"Processando linha: {row}")
                
                aluno_data = {}
                endereco_temp = None
                
                # Extrair dados básicos
                for i, value in enumerate(row):
                    if i in header_mapping:
                        field_name = header_mapping[i]
                        # Limpar e formatar o valor
                        cleaned_value = value.strip() if value else ''
                        
                        # Formatação específica para cada tipo de campo
                        if field_name == 'telefone':
                            # Remover caracteres não numéricos
                            cleaned_value = ''.join(filter(str.isdigit, cleaned_value))
                            # Se tiver 13 dígitos (com +55), remover
                            if len(cleaned_value) >= 13 and cleaned_value.startswith('55'):
                                cleaned_value = cleaned_value[2:]
                            # Se tiver 11 dígitos e começar com 0, remover o 0
                            if len(cleaned_value) == 11 and cleaned_value.startswith('0'):
                                cleaned_value = cleaned_value[1:]
                            # Adicionar hífen para formatar (xx-xxxxxxxxx)
                            if len(cleaned_value) >= 10:
                                cleaned_value = f"{cleaned_value[:2]}-{cleaned_value[2:]}"
                                
                        elif field_name == 'data_nascimento' and cleaned_value:
                            # Tentar diferentes formatos de data
                            date_formats = [
                                '%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y',
                                '%d.%m.%Y', '%Y.%m.%d',
                                '%d/%m/%Y', '%d-%m-%Y'
                            ]
                            
                            # Se a data estiver sem separadores, adicionar
                            if len(cleaned_value) == 8 and cleaned_value.isdigit():
                                cleaned_value = f"{cleaned_value[:2]}/{cleaned_value[2:4]}/{cleaned_value[4:]}"
                            
                            # Se o ano estiver com 2 dígitos, assumir 19xx para datas antigas
                            if len(cleaned_value) == 8 and cleaned_value[6:].isdigit():
                                year = int(cleaned_value[6:])
                                if year < 24:  # Assumindo que ninguém nasceu depois de 2024
                                    cleaned_value = cleaned_value[:6] + '20' + cleaned_value[6:]
                                else:
                                    cleaned_value = cleaned_value[:6] + '19' + cleaned_value[6:]
                            
                            for date_format in date_formats:
                                try:
                                    date_obj = datetime.strptime(cleaned_value, date_format)
                                    cleaned_value = date_obj.strftime('%Y-%m-%d')
                                    break
                                except ValueError:
                                    continue
                            else:
                                print(f"Aviso: Não foi possível converter a data '{cleaned_value}' para nenhum formato conhecido")
                                cleaned_value = '2000-01-01'  # Data padrão temporária
                                
                        elif field_name == 'email':
                            # Remover espaços e converter para minúsculas
                            cleaned_value = cleaned_value.lower().replace(' ', '')
                            
                        elif field_name == 'endereco' and cleaned_value:
                            endereco_temp = cleaned_value
                        
                        aluno_data[field_name] = cleaned_value
                
                # Adicionar campos obrigatórios se não existirem
                if 'cpf' not in aluno_data or not aluno_data['cpf']:
                    aluno_data['cpf'] = gerar_cpf_temporario()  # CPF temporário único
                    
                if 'rg' not in aluno_data or not aluno_data['rg']:
                    aluno_data['rg'] = '000000000'  # RG temporário
                    
                if 'endereco' not in aluno_data or not aluno_data['endereco']:
                    aluno_data['endereco'] = endereco_temp or 'Endereço não informado'  # Endereço temporário
                
                if 'religiao' not in aluno_data or not aluno_data['religiao']:
                    aluno_data['religiao'] = 'Não informada'  # Valor padrão para religião
                
                aluno_data['data_inicio_desenvolvimento'] = datetime.now().strftime('%Y-%m-%d')  # Data atual como padrão
                
                print(f"Dados do aluno mapeados: {aluno_data}")
                
                # Validar dados básicos antes de inserir
                if not aluno_data.get('nome'):
                    print("Linha ignorada - nome não encontrado")
                    continue
                    
                if aluno_data.get('email') and '@' not in aluno_data['email']:
                    print(f"Aviso: Email inválido para {aluno_data['nome']}")
                    aluno_data['email'] = None
                
                if aluno_data.get('telefone') and len(aluno_data['telefone'].replace('-', '')) < 10:
                    print(f"Aviso: Telefone inválido para {aluno_data['nome']}")
                    aluno_data['telefone'] = None
                
                # Inserir no banco de dados
                print(f"Tentando inserir aluno: {aluno_data['nome']}")
                response = supabase.table('alunos').insert(aluno_data).execute()
                if response.data:
                    imported_count += 1
                    print(f"Aluno inserido com sucesso: {aluno_data['nome']}")
                        
            except Exception as e:
                print(f"Erro ao importar aluno {aluno_data.get('nome', 'desconhecido')}: {str(e)}")
                continue
                
        print(f"Importação finalizada. Total importado: {imported_count}")
        return jsonify({
            'message': f'{imported_count} alunos importados com sucesso. Lembre-se de atualizar os CPFs, RGs e endereços corretos posteriormente.',
            'imported_count': imported_count
        })
        
    except Exception as e:
        print(f"Erro ao importar dados: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/convidados')
@login_required
def convidados_lista():
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
    response = supabase.table('convidados').select("*").execute()
    guests = response.data
    return render_template('lista_convidados.html', guests=guests)

@app.route('/add_guest', methods=['POST'])
@login_required
@role_required(['owner', 'admin'])
def add_guest():
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
    data = request.json
    
    try:
        response = supabase.table('convidados').insert({
            'nome': data['nome'],
            'cidade': data['cidade'],
            'email': data['email'],
            'telefone': data['telefone']
        }).execute()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Erro ao adicionar convidado: {str(e)}")
        return jsonify({'success': False})

@app.route('/delete_guest/<guest_id>', methods=['DELETE'])
@login_required
@role_required(['owner'])
def delete_guest(guest_id):
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
    try:
        response = supabase.table('convidados').delete().eq('id', guest_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Erro ao deletar convidado: {str(e)}")
        return jsonify({'success': False})

@app.route('/delete_aluno/<aluno_id>', methods=['DELETE'])
@login_required
@role_required(['owner'])
def delete_aluno(aluno_id):
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
    try:
        response = supabase.table('alunos').delete().eq('id', aluno_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        print(f"Erro ao deletar aluno: {str(e)}")
        return jsonify({'success': False})

@app.route('/visualizar_aluno/<int:id>')
@login_required
def visualizar_aluno(id):
    try:
        supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
        response = supabase.table('alunos').select("*").eq('id', id).execute()
        
        if not response.data:
            return "Aluno não encontrado", 404
            
        aluno = response.data[0]
        
        # Mantém as datas no formato ISO para os inputs type="date"
        # Não precisa formatar as datas aqui, pois o HTML vai mostrar no formato correto
        
        # Garante que a foto_url está presente
        if not aluno.get('foto_url'):
            aluno['foto_url'] = None
        
        return render_template('visualizar_aluno.html', aluno=aluno)
    except Exception as e:
        print("Erro ao visualizar aluno:", str(e))
        return str(e), 500

@app.route('/editar_aluno/<int:id>')
@login_required
def editar_aluno(id):
    try:
        supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
        response = supabase.table('alunos').select("*").eq('id', id).execute()
        if not response.data:
            return "Aluno não encontrado", 404
        
        aluno = response.data[0]
        return render_template('editar_aluno.html', aluno=aluno)
    except Exception as e:
        print(f"Erro ao carregar aluno para edição: {str(e)}")
        return "Erro ao carregar dados do aluno", 500

@app.route('/cadastrar_aluno', methods=['POST'])
@login_required
@role_required(['owner', 'admin'])
def cadastrar_aluno():
    try:
        data = request.form.to_dict()
        foto = request.files.get('foto')
        
        # Handle photo upload
        foto_url = None
        if foto:
            filename = secure_filename(foto.filename)
            foto_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            foto.save(foto_path)
            foto_url = url_for('uploaded_file', filename=filename)

        # Format dates for database storage
        date_fields = [
            'data_nascimento',
            'data_inicio_desenvolvimento',
            'data_inicio_estagio',
            'data_iniciacao_magista',
            'data_inicio_not',
            'data_iniciacao_mestre'
        ]
        
        for field in date_fields:
            if data.get(field):
                try:
                    date_obj = datetime.strptime(data[field], '%Y-%m-%d')
                    data[field] = date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    data[field] = None

        # Prepare data for database
        aluno_data = {
            'nome': data.get('nome'),
            'email': data.get('email'),
            'telefone': data.get('telefone'),
            'cpf': data.get('cpf'),
            'rg': data.get('rg'),
            'endereco': data.get('endereco'),
            'religiao': data.get('religiao'),
            'data_nascimento': data.get('data_nascimento'),
            'data_inicio_desenvolvimento': data.get('data_inicio_desenvolvimento'),
            'data_inicio_estagio': data.get('data_inicio_estagio'),
            'data_iniciacao_magista': data.get('data_iniciacao_magista'),
            'data_inicio_not': data.get('data_inicio_not'),
            'data_iniciacao_mestre': data.get('data_iniciacao_mestre'),
            'foto_url': foto_url
        }

        # Insert into database
        supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
        result = supabase.table('alunos').insert(aluno_data).execute()

        return jsonify({'success': True, 'message': 'Aluno cadastrado com sucesso!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/aluno/<id>', methods=['PUT'])
@login_required
@role_required(['owner', 'admin'])
def atualizar_aluno_api(id):
    try:
        data = request.json
        print("Dados recebidos:", data)  # Debug log
        
        supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
        
        # Get current student data
        response = supabase.table('alunos').select("*").eq('id', id).execute()
        if not response.data:
            return jsonify({'error': 'Aluno não encontrado'}), 404
            
        current_data = response.data[0]
        
        # Função auxiliar para formatar data
        def format_date_for_db(date_str):
            if date_str is None:
                return None
            if date_str == '':
                return None
            try:
                # Se já estiver no formato ISO, retorna como está
                if re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
                    return date_str
                # Caso contrário, tenta converter
                return datetime.strptime(date_str, '%Y-%m-%d').strftime('%Y-%m-%d')
            except:
                print(f"Erro ao processar data: {date_str}")  # Debug log
                return None
            
        # Update student data
        update_data = {
            'nome': data.get('nome'),
            'data_nascimento': format_date_for_db(data.get('data_nascimento')),
            'cpf': data.get('cpf'),
            'rg': data.get('rg'),
            'cep': data.get('cep'),
            'endereco': data.get('endereco'),
            'numero': data.get('numero'),
            'complemento': data.get('complemento'),
            'bairro': data.get('bairro'),
            'cidade': data.get('cidade'),
            'estado': data.get('estado'),
            'email': data.get('email'),
            'telefone': data.get('telefone'),
            'religiao': data.get('religiao'),
            'unidade': data.get('unidade'),
            'data_inicio_desenvolvimento': format_date_for_db(data.get('data_inicio_desenvolvimento')),
            'data_inicio_estagio': format_date_for_db(data.get('data_inicio_estagio')),
            'data_iniciacao_magista': format_date_for_db(data.get('data_iniciacao_magista')),
            'data_inicio_not': format_date_for_db(data.get('data_inicio_not')),
            'data_iniciacao_mestre': format_date_for_db(data.get('data_iniciacao_mestre')),
            'fundador': data.get('fundador'),
            'observacoes': data.get('observacoes'),
            'foto_url': current_data.get('foto_url')
        }
        
        print("Dados formatados:", update_data)  # Debug log
        
        # Manter os campos de data mesmo que sejam None
        date_fields = [
            'data_nascimento',
            'data_inicio_desenvolvimento',
            'data_inicio_estagio',
            'data_iniciacao_magista',
            'data_inicio_not',
            'data_iniciacao_mestre'
        ]
        
        # Remove None values and empty strings, exceto para campos de data
        update_data = {k: v for k, v in update_data.items() 
                      if v is not None and v != '' or k in date_fields}
        
        print("Dados para atualização:", update_data)  # Debug log
        
        # Update in Supabase
        response = supabase.table('alunos').update(update_data).eq('id', id).execute()
        print("Resposta do Supabase:", response)  # Debug log
        
        if response.data:
            return jsonify({'success': True, 'data': response.data[0]})
        else:
            return jsonify({'error': 'Erro ao atualizar aluno'}), 400
            
    except Exception as e:
        print("Erro ao atualizar aluno:", str(e))  # Debug log
        return jsonify({'error': str(e)}), 500

@app.route('/api/aluno/<id>/foto', methods=['POST'])
@login_required
def atualizar_foto_api(id):
    try:
        if 'foto' not in request.files:
            return jsonify({'error': 'Nenhuma foto enviada'}), 400
            
        foto = request.files['foto']
        if foto.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
            
        if foto:
            # Create a secure filename
            filename = secure_filename(f"{id}_{foto.filename}")
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Save the original file
            foto.save(filepath)
            
            # Process the image (crop to 3:4 and resize)
            processed_img = processar_foto(filepath)
            if processed_img:
                processed_img.save(filepath)
                
                # Update the photo URL in Supabase
                foto_url = f"/uploads/{filename}"
                response = supabase.table('alunos').update({
                    'foto_path': filename
                }).eq('id', id).execute()
                
                if response.data:
                    return jsonify({
                        'success': True,
                        'foto_path': filename
                    })
                    
        return jsonify({'error': 'Erro ao processar foto'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/aluno/<int:aluno_id>', methods=['DELETE'])
@login_required
@role_required(['owner'])
def deletar_aluno_api(aluno_id):
    try:
        # Conecta ao banco de dados
        supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
        
        # Deleta o aluno
        response = supabase.table('alunos').delete().eq('id', aluno_id).execute()
        
        # Verifica se o aluno foi deletado
        if response.data:
            return jsonify({'message': 'Aluno deletado com sucesso'}), 200
        else:
            return jsonify({'error': 'Erro ao deletar aluno'}), 500
            
    except Exception as e:
        print('Erro ao deletar aluno:', str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/frequencia')
@login_required
@role_required(['owner', 'admin'])
def frequencia():
    return render_template('frequencia.html')

@app.route('/api/aluno/<int:id>/frequencia', methods=['POST'])
@login_required
@role_required(['owner', 'admin'])
def salvar_frequencia_aluno(id):
    try:
        data = request.get_json()
        data_frequencia = data.get('data')
        tipo = data.get('tipo')

        if not data_frequencia or not tipo:
            return jsonify({'error': 'Data e tipo são obrigatórios'}), 400

        # Buscar frequência existente
        response = supabase.table('frequencias').select('*').eq('aluno_id', id).eq('data', data_frequencia).execute()
        frequencia_existente = response.data[0] if response.data else None

        if frequencia_existente:
            # Se já existe uma frequência para esta data, atualiza
            supabase.table('frequencias').update({'tipo': tipo}).eq('id', frequencia_existente['id']).execute()
        else:
            # Se não existe, cria uma nova
            supabase.table('frequencias').insert({
                'aluno_id': id,
                'data': data_frequencia,
                'tipo': tipo
            }).execute()

        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"Erro ao salvar frequência: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/aluno/<int:id>/frequencia', methods=['GET'])
@login_required
def obter_frequencia_aluno(id):
    try:
        mes = request.args.get('mes')
        ano = request.args.get('ano')

        if not mes or not ano:
            return jsonify({'error': 'Mês e ano são obrigatórios'}), 400

        # Converter para inteiros
        mes = int(mes)
        ano = int(ano)

        # Formatar datas para o início e fim do mês
        inicio_mes = f"{ano}-{mes:02d}-01"
        fim_mes = f"{ano}-{mes:02d}-31"  # Simplificado, mas funciona para nosso caso

        response = supabase.table('frequencias').select('*').eq('aluno_id', id).gte('data', inicio_mes).lte('data', fim_mes).execute()
        
        # Formatar resposta
        frequencias = {}
        for freq in response.data:
            data = freq['data']
            frequencias[data] = freq['tipo']

        return jsonify(frequencias), 200
    except Exception as e:
        print(f"Erro ao obter frequências: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Iniciando o servidor Flask...")
    
    # Atualizar alunos existentes para ativos
    try:
        response = supabase.table('alunos').update({'inativo': False}).is_('inativo', None).execute()
        print(f"Alunos atualizados para ativos: {len(response.data) if response.data else 0}")
    except Exception as e:
        print(f"Erro ao atualizar status dos alunos: {str(e)}")
    
    app.run(debug=True)