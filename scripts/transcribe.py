#!/usr/bin/env python3
"""
Whisper transcription script for NaoNao dictation app.
Usage: python transcribe.py <audio_file_path> [model_name]

Defaults to 'turbo' model with GPU acceleration.
"""
import sys
import torch
import whisper


def transcribe(audio_path: str, model_name: str = "turbo") -> int:
    """Transcribe audio file using Whisper."""
    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        use_fp16 = device == "cuda"

        # Print device info to stderr so it doesn't pollute stdout
        print(f"Using device: {device} | Model: {model_name} | fp16: {use_fp16}", file=sys.stderr)

        model = whisper.load_model(model_name, device=device)
        result = model.transcribe(audio_path, fp16=use_fp16, language="en")

        # Print only the transcribed text to stdout
        print(result["text"].strip())
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <audio_file_path> [model_name]", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 else "turbo"
    sys.exit(transcribe(audio_path, model_name))
