from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps
import os
from database import db_connection
import bcrypt
from dotenv import load_dotenv
import uuid
import random
import string

load_dotenv()

auth = Blueprint('auth', __name__)
login_manager = LoginManager()

# Configuração do email
def init_mail(app):
    app.config['MAIL_SERVER'] = 'mail.aprendamagia.com.br'
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = True
    app.config['MAIL_USERNAME'] = 'desenrola@aprendamagia.com.br'
    app.config['MAIL_PASSWORD'] = 'Af23123011!,'
    # mail.init_app(app)

class User(UserMixin):
    def __init__(self, id, email, role):
        self.id = id
        self.email = email
        self.role = role

def init_login(app):
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(user_id):
    supabase = db_connection()
    response = supabase.table('users').select("*").eq('id', user_id).execute()
    user = response.data[0] if response.data else None
    
    if user:
        return User(user['id'], user['email'], user['role'])
    return None

def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('auth.login'))
            if current_user.role not in roles:
                flash('Você não tem permissão para acessar esta página.', 'danger')
                return redirect(url_for('index'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def send_reset_email(email, password):
    try:
        print("=== DEBUG EMAIL RESET ===")
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        # Configurações do servidor
        smtp_server = "mail.aprendamagia.com.br"
        smtp_port = 465
        smtp_user = "desenrola@aprendamagia.com.br"
        smtp_password = "Af23123011!,"
        
        print(f"Conectando ao servidor: {smtp_server}:{smtp_port}")
        
        # Criar mensagem
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = email
        msg['Subject'] = "Redefinição de Senha"
        
        body = f'''Sua senha foi redefinida com sucesso!

Sua nova senha temporária é: {password}

Por favor, faça login e altere sua senha imediatamente por questões de segurança.

Esta é uma mensagem automática, não responda.'''
        
        msg.attach(MIMEText(body, 'plain'))
        
        print("Mensagem configurada, tentando enviar...")
        
        # Conectar ao servidor
        server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        server.login(smtp_user, smtp_password)
        
        # Enviar email
        server.send_message(msg)
        server.quit()
        
        print("Email de reset enviado com sucesso!")
        print("===================")
        
    except Exception as e:
        print("=== ERRO NO EMAIL DE RESET ===")
        print(f"Erro detalhado: {str(e)}")
        print(f"Tipo do erro: {type(e)}")
        import traceback
        traceback.print_exc()
        print("===================")
        raise e

def generate_reset_token(user_id):
    return jwt.encode(
        {'reset_password': user_id, 'exp': datetime.utcnow() + timedelta(hours=24)},
        os.getenv('SECRET_KEY'),
        algorithm='HS256'
    )

@auth.app_template_filter('datetime')
def format_datetime(value):
    if not value:
        return ''
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            return value
    
    # Se a data é de hoje, mostrar apenas a hora
    if value.date() == datetime.utcnow().date():
        return value.strftime('%H:%M')
    
    # Se a data é deste ano, não mostrar o ano
    if value.year == datetime.utcnow().year:
        return value.strftime('%d/%m %H:%M')
    
    # Caso contrário, mostrar data completa
    return value.strftime('%d/%m/%Y %H:%M')

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Se for o primeiro login do usuário admin, atualizar a senha
        if email == 'paularacy@gmail.com' and password == 'Owner@2024':
            supabase = db_connection()
            result = supabase.table('users').select('*').eq('email', email).execute()
            user = result.data[0] if result.data else None
            
            if user and not user.get('password_changed'):
                # Gerar novo hash para a senha
                new_hash = bcrypt.hashpw('Owner@2024'.encode('utf-8'), bcrypt.gensalt())
                
                # Atualizar a senha no banco
                supabase.table('users').update({
                    'password_hash': new_hash.decode('utf-8'),
                    'password_changed': True,
                    'last_login_at': datetime.utcnow().isoformat()
                }).eq('id', user['id']).execute()
                
                # Criar objeto de usuário e fazer login
                user_obj = User(
                    id=user['id'],
                    email=user['email'],
                    role=user.get('role', 'user')
                )
                login_user(user_obj)
                flash('Login realizado com sucesso!', 'success')
                return redirect(url_for('index'))
        
        # Login normal para outros casos
        supabase = db_connection()
        result = supabase.table('users').select('*').eq('email', email).execute()
        user = result.data[0] if result.data else None
        
        if not user or not user.get('active', True):
            flash('Email ou senha incorretos.', 'danger')
            return redirect(url_for('auth.login'))
        
        try:
            stored_hash = user.get('password_hash')
            if not stored_hash:
                print("Password hash not found in user data:", user)
                flash('Erro ao verificar senha.', 'danger')
                return redirect(url_for('auth.login'))
            
            if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                # Atualizar último login
                supabase.table('users').update({
                    'last_login_at': datetime.utcnow().isoformat()
                }).eq('id', user['id']).execute()
                
                user_obj = User(
                    id=user['id'],
                    email=user['email'],
                    role=user.get('role', 'user')
                )
                login_user(user_obj)
                flash('Login realizado com sucesso!', 'success')
                return redirect(url_for('index'))
            else:
                flash('Email ou senha incorretos.', 'danger')
                return redirect(url_for('auth.login'))
        except Exception as e:
            print("Error during password check:", str(e))
            flash('Erro ao verificar senha.', 'danger')
            return redirect(url_for('auth.login'))
    
    return render_template('login.html')

@auth.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        invite_code = request.form.get('invite_code')
        
        if password != confirm_password:
            flash('As senhas não coincidem.', 'danger')
            return redirect(url_for('auth.signup'))
        
        supabase = db_connection()
        
        # Verificar código de convite
        invite_response = supabase.table('invite_codes').select("*").eq('code', invite_code).eq('used', False).execute()
        if not invite_response.data:
            flash('Código de convite inválido ou já utilizado.', 'danger')
            return redirect(url_for('auth.signup'))
        
        # Verificar se o email já existe
        user_response = supabase.table('users').select("*").eq('email', email).execute()
        if user_response.data:
            flash('Este email já está cadastrado.', 'danger')
            return redirect(url_for('auth.signup'))
        
        try:
            # Criar novo usuário
            user_id = str(uuid.uuid4())
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            # Inserir novo usuário
            supabase.table('users').insert({
                'id': user_id,
                'email': email,
                'password_hash': hashed_password.decode('utf-8'),
                'role': 'user',
                'active': True,
                'created_at': datetime.utcnow().isoformat()
            }).execute()
            
            # Marcar código de convite como usado
            supabase.table('invite_codes').update({
                'used': True,
                'used_at': datetime.utcnow().isoformat()
            }).eq('code', invite_code).execute()
            
            flash('Conta criada com sucesso! Faça login para continuar.', 'success')
            return redirect(url_for('auth.login'))
            
        except Exception as e:
            print("Error creating user:", str(e))
            flash('Erro ao criar conta. Tente novamente.', 'danger')
            return redirect(url_for('auth.signup'))
    
    return render_template('signup.html')

@auth.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        
        supabase = db_connection()
        response = supabase.table('users').select("*").eq('email', email).execute()
        user = response.data[0] if response.data else None
        
        if user:
            token = generate_reset_token(user['id'])
            
            # Salvar token no banco
            supabase.table('password_reset_tokens').insert({
                'id': str(uuid.uuid4()),
                'user_id': user['id'],
                'token': token,
                'expires_at': (datetime.utcnow() + timedelta(hours=24)).isoformat(),
                'used': False
            }).execute()
            
            try:
                send_reset_email(email, token)
                flash('Um email com instruções para redefinir sua senha foi enviado.', 'info')
            except Exception as e:
                print("Error sending email:", str(e))
                flash('Erro ao enviar email. Por favor, tente novamente.', 'danger')
            return redirect(url_for('auth.login'))
        
        flash('Email não encontrado.', 'danger')
    
    return render_template('forgot_password.html')

@auth.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    try:
        token_data = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=['HS256'])
        user_id = token_data.get('reset_password')
        
        supabase = db_connection()
        
        # Verificar se o token é válido e não foi usado
        token_response = supabase.table('password_reset_tokens').select("*").eq('token', token).eq('used', False).execute()
        if not token_response.data:
            flash('Link de redefinição de senha inválido ou já utilizado.', 'danger')
            return redirect(url_for('auth.login'))
        
        if request.method == 'POST':
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')
            
            if password != confirm_password:
                flash('As senhas não coincidem.', 'danger')
                return redirect(url_for('auth.reset_password', token=token))
            
            # Atualizar senha
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            supabase.table('users').update({
                'password_hash': hashed_password.decode('utf-8')
            }).eq('id', user_id).execute()
            
            # Marcar token como usado
            supabase.table('password_reset_tokens').update({
                'used': True
            }).eq('token', token).execute()
            
            flash('Senha atualizada com sucesso! Faça login para continuar.', 'success')
            return redirect(url_for('auth.login'))
        
        return render_template('reset_password.html', token=token)
        
    except jwt.ExpiredSignatureError:
        flash('O link de redefinição de senha expirou.', 'danger')
        return redirect(url_for('auth.login'))
    except jwt.InvalidTokenError:
        flash('Link de redefinição de senha inválido.', 'danger')
        return redirect(url_for('auth.login'))

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Você foi desconectado.', 'info')
    return redirect(url_for('auth.login'))

@auth.route('/api/user/<user_id>/role', methods=['GET'])
@login_required
def get_user_role(user_id):
    # Verificar se o usuário atual tem permissão (owner ou adm)
    if current_user.role not in ['owner', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    supabase = db_connection()
    
    # Buscar o papel do usuário
    response = supabase.table('users').select('role').eq('id', user_id).execute()
    user = response.data[0] if response.data else None
    
    if user:
        return jsonify({'role': user['role']})
    return jsonify({'error': 'User not found'}), 404

@auth.route('/api/user/<user_id>/role', methods=['POST'])
@login_required
def update_user_role(user_id):
    # Verificar se o usuário atual tem permissão (owner ou adm)
    if current_user.role not in ['owner', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Owner só pode ser definido por outro owner
    new_role = request.json.get('role')
    if new_role == 'owner' and current_user.role != 'owner':
        return jsonify({'error': 'Only owners can assign owner role'}), 403
    
    supabase = db_connection()
    
    try:
        # Atualizar o papel do usuário
        response = supabase.table('users').update({'role': new_role}).eq('id', user_id).execute()
        
        if response.data:
            return jsonify({'success': True})
        return jsonify({'error': 'User not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth.route('/admin')
@login_required
def admin_panel():
    if current_user.role not in ['owner', 'admin']:
        flash('Acesso não autorizado', 'danger')
        return redirect(url_for('auth.login'))
    
    supabase = db_connection()
    
    # Buscar usuários com permissões especiais e usuários sendo buscados
    search = request.args.get('search', '').lower()
    if search:
        # Se houver busca, incluir todos os usuários que correspondam
        response = supabase.table('users').select('*').execute()
        users = [u for u in response.data if search in u.get('name', '').lower() 
                or search in u.get('email', '').lower()]
    else:
        # Se não houver busca, mostrar apenas usuários com permissões especiais
        response = supabase.table('users').select('*').not_.eq('role', 'user').execute()
        users = response.data
    
    return render_template('admin_panel.html', 
                         users=users,
                         current_user=current_user)

@auth.route('/admin/generate-invite', methods=['POST'])
@login_required
@role_required(['admin', 'owner'])
def generate_invite():
    try:
        supabase = db_connection()
        code = str(uuid.uuid4())[:8]
        
        # Insert new invite code
        supabase.table('invite_codes').insert({
            'code': code,
            'created_by': str(current_user.id),  # Convert UUID to string
            'expires_at': (datetime.utcnow() + timedelta(days=7)).isoformat()
        }).execute()
        
        return jsonify({'code': code}), 200
    except Exception as e:
        print("Error generating invite:", str(e))
        return jsonify({'error': str(e)}), 500

@auth.route('/admin/send-reset/<user_id>', methods=['POST'])
@login_required
@role_required(['admin', 'owner'])
def send_user_reset(user_id):
    try:
        supabase = db_connection()
        
        # Get user email
        user_response = supabase.table('users').select("email").eq('id', user_id).execute()
        if not user_response.data:
            return jsonify({'error': 'User not found'}), 404
        
        user_email = user_response.data[0]['email']
        token = generate_reset_token(str(user_id))  # Convert UUID to string
        send_reset_email(user_email, token)
        
        return jsonify({'message': 'Reset email sent successfully'}), 200
    except Exception as e:
        print("Error sending reset:", str(e))
        return jsonify({'error': str(e)}), 500

@auth.route('/admin/send-mass-reset', methods=['POST'])
@login_required
@role_required(['owner'])
def send_mass_reset():
    supabase = db_connection()
    response = supabase.table('users').select("*").execute()
    users = response.data
    
    count = 0
    for user in users:
        token = generate_reset_token(user['id'])
        
        # Salvar token no banco
        supabase.table('password_reset_tokens').insert({
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'token': token,
            'expires_at': (datetime.utcnow() + timedelta(hours=24)).isoformat(),
            'used': False
        }).execute()
        
        send_reset_email(user['email'], token)
        count += 1
    
    flash(f'Emails de redefinição de senha enviados para {count} usuários.', 'success')
    return redirect(url_for('auth.admin_panel'))

@auth.route('/admin/delete-user/<user_id>', methods=['POST'])
@login_required
@role_required(['owner'])
def admin_delete_user(user_id):
    if not user_id:
        flash('ID do usuário não fornecido.', 'error')
        return redirect(url_for('auth.admin_panel'))
    
    supabase = db_connection()
    
    # Check if user exists
    response = supabase.table('users').select("*").eq('id', user_id).execute()
    user = response.data[0] if response.data else None
    
    if not user:
        flash('Usuário não encontrado.', 'error')
        return redirect(url_for('auth.admin_panel'))
    
    # Delete user
    response = supabase.table('users').delete().eq('id', user_id).execute()
    
    flash('Usuário inativado com sucesso.', 'success')
    return redirect(url_for('auth.admin_panel'))

@auth.route('/api/users', methods=['POST'])
@login_required
def create_user():
    if current_user.role not in ['owner', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    email = data.get('email')
    role = data.get('role')
    
    if not all([email, role]):
        return jsonify({'error': 'Email e função são obrigatórios'}), 400
    
    # Validar role - ajustado para os valores permitidos no banco
    if role == 'moderador':
        role = 'admin'  # convertendo moderador para admin
    if role == 'adm':
        role = 'admin'  # convertendo adm para admin
    
    if role not in ['user', 'admin', 'owner']:
        return jsonify({'error': 'Função inválida'}), 400
    
    # Apenas owner pode criar outro owner
    if role == 'owner' and current_user.role != 'owner':
        return jsonify({'error': 'Apenas owners podem criar outros owners'}), 403
    
    supabase = db_connection()
    
    try:
        # Verificar se email já existe
        response = supabase.table('users').select('*').eq('email', email).execute()
        if response.data:
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Gerar senha aleatória
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        password_hash = generate_password_hash(temp_password)
        
        # Criar usuário
        user_data = {
            'email': email,
            'password_hash': password_hash,
            'role': role,
            'created_at': datetime.utcnow().isoformat()
        }
        
        response = supabase.table('users').insert(user_data).execute()
        
        if response.data:
            # Enviar email com senha temporária
            send_password_email(email, temp_password)
            return jsonify({'success': True})
        
        return jsonify({'error': 'Erro ao criar usuário'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth.route('/api/users/<user_id>', methods=['GET'])
@login_required
def get_user(user_id):
    if current_user.role not in ['owner', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    supabase = db_connection()
    
    response = supabase.table('users').select('*').eq('id', user_id).execute()
    user = response.data[0] if response.data else None
    
    if user:
        return jsonify(user)
    return jsonify({'error': 'Usuário não encontrado'}), 404

@auth.route('/api/users/<user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    if current_user.role not in ['owner', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    role = data.get('role')
    
    if not role:
        return jsonify({'error': 'Função é obrigatória'}), 400
    
    if role not in ['user', 'admin', 'owner']:
        return jsonify({'error': 'Função inválida'}), 400
    
    # Apenas owner pode definir outro owner
    if role == 'owner' and current_user.role != 'owner':
        return jsonify({'error': 'Apenas owners podem definir outros owners'}), 403
    
    supabase = db_connection()
    
    try:
        response = supabase.table('users').update({'role': role}).eq('id', user_id).execute()
        
        if response.data:
            return jsonify({'success': True})
        return jsonify({'error': 'Usuário não encontrado'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth.route('/api/users/<user_id>/reset-password', methods=['POST'])
@login_required
def reset_user_password(user_id):
    if current_user.role not in ['owner', 'admin']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    supabase = db_connection()
    
    try:
        # Gerar nova senha
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        password_hash = generate_password_hash(temp_password)
        
        # Atualizar senha no banco
        user = supabase.table('users').select('*').eq('id', user_id).execute()
        
        if not user.data:
            return jsonify({'error': 'Usuário não encontrado'}), 404
            
        user_email = user.data[0]['email']
        
        # Atualizar senha
        response = supabase.table('users').update({
            'password_hash': password_hash
        }).eq('id', user_id).execute()
        
        if response.data:
            # Enviar email com nova senha
            send_reset_email(user_email, temp_password)
            return jsonify({'success': True})
            
        return jsonify({'error': 'Erro ao redefinir senha'}), 500
        
    except Exception as e:
        print(f"Erro ao resetar senha: {str(e)}")
        return jsonify({'error': str(e)}), 500

@auth.route('/api/users/<user_id>', methods=['DELETE'])
@login_required
def api_delete_user(user_id):
    if current_user.role != 'owner':
        return jsonify({'error': 'Apenas owners podem excluir usuários'}), 403
    
    if user_id == str(current_user.id):
        return jsonify({'error': 'Você não pode excluir seu próprio usuário'}), 400
    
    supabase = db_connection()
    
    try:
        response = supabase.table('users').delete().eq('id', user_id).execute()
        
        if response.data:
            return jsonify({'success': True})
        return jsonify({'error': 'Usuário não encontrado'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def send_password_email(email, password):
    try:
        print("=== DEBUG EMAIL ===")
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        # Configurações do servidor
        smtp_server = "mail.aprendamagia.com.br"
        smtp_port = 465
        smtp_user = "desenrola@aprendamagia.com.br"
        smtp_password = "Af23123011!,"
        
        print(f"Conectando ao servidor: {smtp_server}:{smtp_port}")
        
        # Criar mensagem
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = email
        msg['Subject'] = "Sua nova senha"
        
        body = f'''Sua senha temporária é: {password}
        
Por favor, faça login e altere sua senha imediatamente.

Esta é uma mensagem automática, não responda.'''
        
        msg.attach(MIMEText(body, 'plain'))
        
        print("Mensagem configurada, tentando enviar...")
        
        # Conectar ao servidor
        server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        server.login(smtp_user, smtp_password)
        
        # Enviar email
        server.send_message(msg)
        server.quit()
        
        print("Email enviado com sucesso!")
        print("===================")
        
    except Exception as e:
        print("=== ERRO NO EMAIL ===")
        print(f"Erro detalhado: {str(e)}")
        print(f"Tipo do erro: {type(e)}")
        import traceback
        traceback.print_exc()
        print("===================")
        raise e
