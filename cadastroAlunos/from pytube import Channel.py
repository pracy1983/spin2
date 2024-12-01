from pytube import Channel
from tqdm import tqdm
import datetime

def teste_obter_primeiro_video(url_do_canal):
    try:
        canal = Channel(url_do_canal)
        primeiro_video = next(iter(canal.videos), None)

        if primeiro_video:
            print(f"Sucesso! Primeiro vídeo encontrado:\nTítulo: {primeiro_video.title}\nURL: {primeiro_video.watch_url}\nData de Publicação: {primeiro_video.publish_date.strftime('%d/%m/%Y')}")
            return True
        else:
            print("Não foi possível encontrar vídeos neste canal.")
            return False
    except Exception as e:
        print(f"Ocorreu um erro ao tentar acessar os vídeos do canal: {e}")
        return False

def listar_videos_canal_para_txt(url_do_canal):
    print("Obtendo lista de vídeos do canal...")
    canal = Channel(url_do_canal)
    videos = list(canal.videos)
    print("Lista de vídeos obtida com sucesso.")

    print("Ordenando vídeos do mais antigo para o mais novo...")
    videos.sort(key=lambda video: video.publish_date)
    print("Vídeos ordenados.")

    print("Escrevendo os vídeos em um arquivo TXT...")
    with open("lista_videos.txt", "w", encoding="utf-8") as arquivo, tqdm(total=len(videos), desc="Progresso", unit="video", ncols=100) as barra_progresso:
        for indice, video in enumerate(videos, start=1):
            data_formatada = video.publish_date.strftime("%d/%m/%Y")
            arquivo.write(f"{indice} - {video.watch_url} - {data_formatada}\n")
            barra_progresso.update(1)
    print("Arquivo 'lista_videos.txt' criado com sucesso. Processo concluído!")

def main():
    url_do_canal = 'https://www.youtube.com/channel/UCJbHuEEOTzqMJ2lbEypKyWQ'
    if teste_obter_primeiro_video(url_do_canal):
        listar_videos_canal_para_txt(url_do_canal)
    else:
        print("Não foi possível prosseguir com o scrapping devido a um erro no teste preliminar.")

if __name__ == "__main__":
    main()
