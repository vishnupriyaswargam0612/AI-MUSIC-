import struct
import math
import random
import os

# Ensure backend/music directory exists
MUSIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "covers")

def generate_ambient_track(mood, filename_prefix="music"):
    os.makedirs(MUSIC_DIR, exist_ok=True)
    
    # CD quality: 22050Hz (lower sample rate to keep file size lightweight for transfer), 16-bit mono
    sample_rate = 22050
    duration = 12.0 # 12 seconds of ambient music
    num_samples = int(sample_rate * duration)
    
    # Frequencies for chords based on mood
    mood_frequencies = {
        "happy": [261.63, 329.63, 392.00, 523.25],       # C Major chord (C4, E4, G4, C5)
        "sad": [220.00, 261.63, 329.63, 440.00],         # A Minor chord (A3, C4, E4, A4)
        "relaxed": [293.66, 349.23, 440.00, 523.25],     # D Minor 7 chord (D4, F4, A4, C5)
        "romantic": [174.61, 220.00, 261.63, 329.63],    # F Major 7 chord (F3, A3, C4, E4)
        "energetic": [329.63, 493.88, 659.25, 830.61]    # E Major chord (E4, B4, E5, G#5)
    }
    
    freqs = mood_frequencies.get(mood.lower(), mood_frequencies["relaxed"])
    audio_data = []
    
    for i in range(num_samples):
        t = i / sample_rate
        
        # Detuned Chorus effect synth pad
        pad_sample = 0.0
        for idx, f in enumerate(freqs):
            # Base sine wave
            osc = math.sin(2 * math.pi * f * t)
            
            # Detuned oscillators for warmth and thickness
            detune_factor = 1.004 + (idx * 0.001)
            detune_osc = math.sin(2 * math.pi * (f * detune_factor) * t)
            
            # Ambient arpeggiator step (subtle volume pulse on chord notes)
            arp_speed = 4.0 if mood.lower() == "energetic" else (1.5 if mood.lower() == "happy" else 0.5)
            arp_val = 0.5 + 0.5 * math.sin(2 * math.pi * arp_speed * t + idx)
            
            pad_sample += (0.6 * osc + 0.4 * detune_osc) * arp_val
            
        pad_sample /= len(freqs) # Normalize mix
        
        # Volume swell LFO (slow atmospheric pulse)
        lfo_speed = 0.35 if mood.lower() == "energetic" else 0.15
        lfo = 0.7 + 0.3 * math.sin(2 * math.pi * lfo_speed * t)
        
        # ADSR Envelope for track bounds
        envelope = 1.0
        if t < 2.0:
            envelope = t / 2.0  # Slow attack fade-in
        elif t > (duration - 2.0):
            envelope = (duration - t) / 2.0  # Slow release fade-out
            
        sample = pad_sample * lfo * envelope
        
        # Convert to 16-bit signed integer (-32768 to 32767)
        int_sample = int(sample * 16000)
        audio_data.append(int_sample)
        
    # Build WAV header
    header = b'RIFF'
    header += b'\x00\x00\x00\x00' # Placeholder for total file size
    header += b'WAVE'
    header += b'fmt '
    # Subchunk size (16), AudioFormat (1=PCM), NumChannels (1=Mono), SampleRate (22050), ByteRate, BlockAlign (2), BitsPerSample (16)
    header += struct.pack('<IHHIIHH', 16, 1, sample_rate, sample_rate * 2, 2, 16)
    header += b'data'
    header += b'\x00\x00\x00\x00' # Placeholder for data chunk size
    
    # Pack PCM data
    raw_data = bytearray()
    for s in audio_data:
        raw_data.extend(struct.pack('<h', s))
        
    # Patch header sizes
    data_size = len(raw_data)
    file_size = 36 + data_size
    
    header = bytearray(header)
    header[4:8] = struct.pack('<I', file_size)
    header[40:44] = struct.pack('<I', data_size)
    
    # Save file
    filename = f"{filename_prefix}_{mood}_{int(random.random() * 1000000)}.wav"
    save_path = os.path.join(MUSIC_DIR, filename)
    with open(save_path, 'wb') as f:
        f.write(header)
        f.write(raw_data)
        
    return f"/covers/{filename}"

if __name__ == "__main__":
    print("Testing procedural audio synthesis...")
    url = generate_ambient_track("relaxed")
    print(f"Generated track: {url}")
