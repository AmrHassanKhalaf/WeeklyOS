class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    // Handle messages from main thread if needed
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const inputData = input[0]; // First channel

    // Calculate RMS for volume
    let sum = 0;
    for (let i = 0; i < inputData.length; i++) {
      sum += inputData[i] * inputData[i];
    }
    const rms = Math.sqrt(sum / inputData.length);

    // Convert to Int16Array for base64 encoding
    const int16 = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      int16[i] = inputData[i] * 32767;
    }

    // Send processed audio data to main thread
    this.port.postMessage({
      type: 'audioData',
      data: int16.buffer,
      rms: rms
    }, [int16.buffer]);

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);