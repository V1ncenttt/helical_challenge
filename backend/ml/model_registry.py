# backend/app/services/model_registry.py

from transformers import AutoModel, AutoTokenizer
from helical.models.scgpt import scGPT, scGPTConfig
from helical.models.geneformer import Geneformer, GeneformerConfig
import torch
import torch.nn as nn
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
models_dir = os.path.join(BASE_DIR, "ml", "parameters")

def singleton(cls):
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance

@singleton
class A():
    def __init__(self):
        self.a = 1
        
a = A()
b = A()
if a is not b:
    raise RuntimeError("A is not a singleton, multiple instances detected.")

@singleton
class ModelRegistry:
    def __init__(self):
        
        self.input_shape = 512
        self.num_classes = 6
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.params_head_scgpt = os.path.join(models_dir, "head_model_scgpt.pth")
        self.params_head_geneformer = os.path.join(models_dir, "head_model_geneformer.pth")

        self.embedding_models = {}
        self.classification_models = {}
        
        self._load_models()
        
        self.id2label= {0: 'ERYTHROID',
        1: 'LYMPHOID',
        2: 'MK',
        3: 'MYELOID',
        4: 'PROGENITOR',
        5: 'STROMA'}
        
        self.num_classes = 6
        
        print("✅ Models loaded successfully----------.")
        
    def _load_models(self):
        print("Loading models...")
        scgpt_config = scGPTConfig(batch_size=4, device=self.device)
        scgpt = scGPT(configurer = scgpt_config)
        self.embedding_models["scgpt"] = scgpt

        geneformer_config = GeneformerConfig(batch_size=4, device=self.device)
        geneformer = Geneformer(configurer = geneformer_config)
        self.embedding_models["geneformer"] = geneformer

        scgpt_classification_head = self._get_head_model()
        scgpt_classification_head.load_state_dict(torch.load(self.params_head_scgpt))
        scgpt_classification_head.to(self.device)
        scgpt_classification_head.eval()
        self.classification_models["scgpt"] = scgpt_classification_head
        
        geneformer_classification_head = self._get_head_model()
        geneformer_classification_head.load_state_dict(torch.load(self.params_head_geneformer))
        #Check if the state_dict file exists at "../ml/parameters/head_model_geneformer.pth"
        if not os.path.exists(self.params_head_geneformer):
            raise FileNotFoundError("State dict file not found.")

        geneformer_classification_head.to(self.device)
        geneformer_classification_head.eval()
        self.classification_models["geneformer"] = geneformer_classification_head

    def get_model(self, name):
        return (self.embedding_models.get(name), self.classification_models.get(name))
    
    def get_device(self):
        return self.device
    
    def get_label(self, id):
        return self.id2label.get(id, "Unknown")
    
    def _get_head_model(self):
        return nn.Sequential(
            nn.Linear(self.input_shape, 128),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(128, 32),
        nn.ReLU(),
        nn.Dropout(0.4),
        nn.Linear(32, self.num_classes)
        )

    
    