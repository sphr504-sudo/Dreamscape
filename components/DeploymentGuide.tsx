
import React from 'react';
import { Terminal, Box, Cloud, Server, ChevronRight } from 'lucide-react';

const DeploymentGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12">
      <section>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <Server className="text-indigo-400 w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">VM Specifications</h2>
            <p className="text-gray-400 text-sm">Target Cloud Architecture (AWS g4dn.4xlarge or GCP n1-highmem-16)</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'OS', value: 'Ubuntu 22.04 LTS' },
            { label: 'CPU', value: '16 Cores Xeon' },
            { label: 'GPU', value: 'NVIDIA V100 32GB' },
            { label: 'RAM', value: '128GB DDR4' },
            { label: 'Storage', value: '2TB NVMe SSD' },
            { label: 'Network', value: '10 Gbps Symmetrical' },
            { label: 'CUDA', value: 'v12.4+' },
            { label: 'Runtime', value: 'Python 3.11' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/10 p-4 rounded-xl text-center">
              <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">{stat.label}</span>
              <span className="text-sm font-bold text-white">{stat.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <Box className="text-emerald-500 w-5 h-5" />
            <h3 className="font-bold">Production Dockerfile</h3>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold uppercase">Optimized for GPU</span>
        </div>
        <div className="p-6 font-mono text-xs text-gray-300 bg-black/60 leading-relaxed">
          <pre>{`FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

# Install System Dependencies
RUN apt-get update && apt-get install -y \\
    ffmpeg libsndfile1-dev python3-pip \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip3 install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy Model Weights (Assuming they are downloaded)
COPY ./weights/tacotron2_v3.pt ./weights/
COPY ./weights/wavenet_v2.pt ./weights/

COPY . .

# Expose API Port
EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]`}</pre>
        </div>
      </section>

      <section className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <Cloud className="text-sky-500 w-5 h-5" />
            <h3 className="font-bold">Kubernetes Orchestration (k8s)</h3>
          </div>
        </div>
        <div className="p-6 font-mono text-xs text-gray-300 bg-black/60">
          <pre>{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: aether-tts-v3
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: tts-engine
        image: aether/tts-neural:latest
        resources:
          limits:
            nvidia.com/gpu: 1 # Assign 1 GPU per replica
            memory: "16Gi"
            cpu: "4"
---
apiVersion: v1
kind: Service
metadata:
  name: tts-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8000`}</pre>
        </div>
      </section>

      <section className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold mb-4">Scalability Roadmap</h3>
        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">Our architecture supports horizontal scaling via Redis-backed task queues (Celery) to handle thousands of concurrent synthesis requests across multiple regions.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
            Full API Documentation <ChevronRight className="w-4 h-4" />
          </button>
          <button className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
            Terraform Manifests <Terminal className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default DeploymentGuide;
