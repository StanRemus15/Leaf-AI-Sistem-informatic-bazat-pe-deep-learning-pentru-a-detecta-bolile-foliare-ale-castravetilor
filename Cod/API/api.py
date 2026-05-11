from fastapi import FastAPI,UploadFile,File
import keras as kr
import numpy as np
import io
import uvicorn
from PIL import Image
import tensorflow as tf
import cv2

import os

from tensorflow.python.ops.gen_array_ops import lower_bound

os.environ['TF_ENABLE_ONEDNN_OPTS']= '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

app = FastAPI()


def contine_frunza(imagine_pil):
    img_array = np.array(imagine_pil)

    if len(img_array.shape) != 3 or img_array.shape[2] != 3:
        return False

    img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)


    lower_bound = np.array([25, 40, 40])
    upper_bound = np.array([95, 255, 255])

    mask = cv2.inRange(img_hsv, lower_bound, upper_bound)
    contururi, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contururi:
        return False

    aria_totala_poza = img_bgr.shape[0] * img_bgr.shape[1]
    aria_totala_verde = 0


    for contur in contururi:
        aria = cv2.contourArea(contur)
        if aria / aria_totala_poza > 0.005:
            aria_totala_verde += aria

    procentaj_final = aria_totala_verde / aria_totala_poza

    print(f"---> Procentaj total de verde valid adunat: {procentaj_final * 100:.2f}%")

    return procentaj_final > 0.15

@kr.saving.register_keras_serializable()
def squeeze_excite_block(tensor,ratio=16):
    filters = tensor.shape[-1]
    s_e_b = kr.layers.GlobalAvgPool2D()(tensor)
    s_e_b = kr.layers.Dense(filters // ratio,activation = 'relu' , kernel_initializer='he_normal')(s_e_b)
    s_e_b = kr.layers.Dense(filters,activation='sigmoid')(s_e_b)
    s_e_b = kr.layers.Reshape((1,1,filters))(s_e_b)
    return kr.layers.Multiply()([tensor,s_e_b])

print("Model loading...")
model = kr.models.load_model('model_antrenare_licenta.keras',custom_objects={'squeeze_excite_block':squeeze_excite_block})
clase_boli = ['Anthracnose', 'Bacterial Wilt', 'Downy Mildew', 'Gummy Stem Blight', 'Healthy']
print("Done")

@app.post("/diagnostic")
async def analizare_poza(file: UploadFile = File(...)):
    continut_poza = await file.read()

    imagine = Image.open(io.BytesIO(continut_poza)).convert('RGB').resize((256,256))

    if not contine_frunza(imagine):
        return {"eroare": "Imaginea nu este frunza"}

    imagine_array = kr.utils.img_to_array(imagine)
    imagine_array = np.expand_dims(imagine_array,axis=0)

    predictii = model.predict(imagine_array)[0]
    rezultate = []
    for i in range(len(clase_boli)):
        rezultate.append({
            "boala": clase_boli[i],
            "siguranta": float(predictii[i] * 100)
        })

    rezultate = sorted(rezultate, key=lambda x: x['siguranta'], reverse=True)

    return {
        "boala_detectata": rezultate[0]['boala'],
        "siguranta": rezultate[0]['siguranta'],
        "alternative": rezultate[1:3]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8050)