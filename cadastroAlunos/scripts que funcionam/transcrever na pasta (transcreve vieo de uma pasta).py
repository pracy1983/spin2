from moviepy.editor import VideoFileClip
from pathlib import Path
import whisper
import tempfile
import os

def print_progress_bar(iteration, total, prefix='', suffix='', length=50, fill='█', print_end="\r"):
    percent = ("{0:.1f}").format(100 * (iteration / float(total)))
    filled_length = int(length * iteration // total)
    bar = fill * filled_length + '-' * (length - filled_length)
    print(f'\r{prefix} |{bar}| {percent}% {suffix}', end=print_end)
    if iteration == total:
        print()

def transcribe_video_to_text(video_paths, model_name="base", output_dir="Transcrição"):
    try:
        modelo = whisper.load_model(model_name)
        transcriptions = "##Script feito por PRACY - www.pracy.com.br\n\n"
        
        # Verifica e cria a pasta Transcrição se necessário
        os.makedirs(output_dir, exist_ok=True)
        print(f"Verificando/criando pasta para transcrições em: {output_dir}")

        if not video_paths:
            print("Nenhum arquivo de vídeo encontrado no diretório especificado.")
            return

        total_videos = len(video_paths)
        print(f"Encontrados {total_videos} vídeos para transcrição.")

        for index, video_file in enumerate(video_paths, start=1):
            print(f"\nTranscrevendo {index} de {total_videos}")
            print_progress_bar(0, 100, prefix='Progresso:', suffix='Completo', length=50)
            print(f"Vídeo {index} - {video_file.name}\nTranscrição\n\n***\n")
            
            with VideoFileClip(str(video_file)) as videoclip:
                temp_audio_path = os.path.join(tempfile.gettempdir(), f"{video_file.stem}.wav")
                videoclip.audio.write_audiofile(temp_audio_path, codec='pcm_s16le', ffmpeg_params=["-ac", "1"], logger=None)
                
                resposta = modelo.transcribe(temp_audio_path, verbose=False)
                transcriptions += f"Vídeo {index} - {video_file.name}\n{resposta['text']}\n\n***\n"

                print_progress_bar(100, 100, prefix='Progresso:', suffix='Completo', length=50)
        
        # Escrever todas as transcrições em um único arquivo
        with open(os.path.join(output_dir, "transcricoes_completas.txt"), 'w', encoding='utf-8') as text_file:
            text_file.write(transcriptions)
        
        print("\nTodas as transcrições foram salvas em transcricoes_completas.txt")

    except Exception as e:
        print(f"Erro: {e}")

# Ajuste para usar o diretório onde o script está sendo executado
directory_to_save = Path(__file__).parent.resolve()
print(f"Procurando vídeos em: {directory_to_save}")

video_extensions = ["*.mp4", "*.avi", "*.mov", "*.mkv", "*.flv", "*.wmv", "*.m4v"]
path_list = [file for extension in video_extensions for file in directory_to_save.glob(extension)]

if not path_list:
    print("Nenhum vídeo encontrado para transcrição. Verifique as extensões dos arquivos e o caminho especificado.")
else:
    transcribe_video_to_text(path_list, output_dir=str(directory_to_save / "Transcrição"))

# Espera por uma entrada do usuário antes de fechar
input("Pressione Enter para sair...")
