from fastapi import FastAPI,UploadFile,File
import keras as kr
import numpy as np
import io
import uvicorn
from PIL import Image
import tensorflow as tf

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

    imagine_array = kr.utils.img_to_array(imagine)
    imagine_array = np.expand_dims(imagine_array,axis=0)

    predictii = model.predict(imagine_array)
    index = np.argmax(predictii[0])

    return {
        "boala_detectata ": clase_boli[index],
        "siguranta":float(predictii[0][index]*100),
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8050)