from youtube_transcript_api import YouTubeTranscriptApi
from pytube import Playlist
import re
def get_playlist_transcripts(playlist_url):
    try:
        playlist = Playlist(playlist_url)
        playlist._video_regex = re.compile(r"\"url\":\"(/watch\?v=[\w-]*)")
        playlist_title = playlist.title
        valid_filename = "".join(char for char in playlist_title if char.isalnum() or char in [" ", "_", "-"]).rstrip()
        content = []
        for video in playlist.videos:
            video_id = video.video_id
            video_title = video.title
            video_title_sanitized = video_title.replace("#", "\#").replace("*", "\*")
            content.append(f"## {video_title_sanitized}\n\n")
            try:
                transcript = YouTubeTranscriptApi.get_transcript(video_id)
                for segment in transcript:
                    text = segment['text']
                    content.append(f"{text}\n")
                content.append("\n---\n\n")
            except:
                content.append(f"Transcript not available for this video.\n\n---\n\n")

        filename = f"{valid_filename}_transcripts.md"
        with open(filename, "w", encoding="utf-8") as file:
            file.writelines(content)
        return f"Transcripts for the playlist saved as {filename}"
    except Exception as e:
        return str(e)

playlist_url = "https://www.youtube.com/playlist?list=PLMrJAkhIeNNQ0BaKuBKY43k4xMo6NSbBa"
result = get_playlist_transcripts(playlist_url)
print(result)
