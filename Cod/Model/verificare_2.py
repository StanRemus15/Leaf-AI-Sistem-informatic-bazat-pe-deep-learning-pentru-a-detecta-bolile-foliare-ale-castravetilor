import os
os.environ["KERAS_BACKEND"] = "torch"

try:
    import keras
    import torch
    print(f"Keras version: {keras.__version__}")
    print(f"Torch version: {torch.__version__}")
    print("Succes! Backend-ul este:", keras.backend.backend())
except Exception as e:
    print("Incă există o problemă:", e)