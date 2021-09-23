import * as tf from '@tensorflow/tfjs-node';
import * as nsfwjs from 'nsfwjs';
import {NSFWJS} from 'nsfwjs';
import {Tensor3D} from '@tensorflow/tfjs';

tf.enableProdMode();

const DEFAULT_MODEL_SIZE = 299;

export class NsfwImageClassifier {
  #model?: NSFWJS;

  async classify(imageBuffer: Buffer) {
    const [model, image] = await Promise.all([
      this.#getModel(),
      tf.node.decodeImage(imageBuffer, 3),
    ]);

    const predictions = await model.classify(image as Tensor3D);

    image.dispose();

    return this.#transformData(predictions);
  }

  async classifyMany(imagesBuffers: Buffer[]) {
    return await Promise.all(imagesBuffers.map(buffer => this.classify(buffer)));
  }

  async #getModel(): Promise<NSFWJS> {
    if (!this.#model) {
      const size = Number(process.env.MODEL_SIZE) || DEFAULT_MODEL_SIZE;

      this.#model = await nsfwjs.load('file://model/', {size});
    }

    return this.#model;
  }

  #transformData(data: { className: string; probability: number }[]): Record<string, number> {
    const result: Record<string, number> = {};

    for (const item of data) {
      result[item.className.toLowerCase()] = item.probability;
    }

    return result;
  }
}
