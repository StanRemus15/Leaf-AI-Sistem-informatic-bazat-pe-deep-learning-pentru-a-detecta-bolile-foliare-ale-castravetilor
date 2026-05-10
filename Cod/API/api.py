from fastapi import FastAPI,UploadFile,File
import keras as kr
import numpy as np
import io
import uvicorn
from PIL import Image
import tensorflow as tf

import os
os.environ['TF_ENABLE_ONEDNN_OPTS']= '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

def contine_frunza(imagine_pil):
    img_hsv = imagine_pil.convert('HSV')
    pix = np.array(img_hsv)

    h = pix[:,:,0]
    s = pix[:,:,1]

    masca_plante =((h>15) & (h<130) & (s>30))
    procentaj = np.sum(masca_plante)/(pix.shape[0]*pix.shape[1])
    return procentaj > 0.03

app = FastAPI()
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