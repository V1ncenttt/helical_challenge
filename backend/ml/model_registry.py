# backend/app/services/model_registry.py

from transformers import AutoModel, AutoTokenizer
from helical.models.scgpt import scGPT, scGPTConfig
from helical.models.geneformer import Geneformer, GeneformerConfig
from classification_head import ClassificationHead
import torch

def singleton(cls):
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance

@singleton
class ModelRegistry:
    def __init__(self):
        
        self.input_shape = 512
        self.num_classes = 10
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.embedding_models = {}
        self.classification_models = {}
        
        self._load_models()
        print("✅ Models loaded successfully----------.")

    def _load_models(self):
        
        scgpt_config = scGPTConfig(batch_size=50, device=self.device)
        scgpt = scGPT(configurer = scgpt_config)
        self.embedding_models["scgpt"] = scgpt

        geneformer_config = GeneformerConfig(batch_size=50, device=self.device)
        geneformer = Geneformer(configurer = geneformer_config)
        self.embedding_models["geneformer"] = geneformer

        scgpt_classification_head = ClassificationHead(self.input_shape, self.num_classes)
        scgpt_classification_head.load_state_dict("path/to/scgpt_classification_head.pth")
        scgpt_classification_head.to(self.device)
        scgpt_classification_head.eval()
        self.classification_models["scgpt"] = scgpt_classification_head
        
        geneformer_classification_head = ClassificationHead(self.input_shape, self.num_classes)
        geneformer_classification_head.load_state_dict("path/to/geneformer_classification_head.pth")
        geneformer_classification_head.to(self.device)
        geneformer_classification_head.eval()
        self.classification_models["geneformer"] = geneformer_classification_head

    def get_model(self, name):
        return (self.embedding_models.get(name), self.classification_models.get(name))
    
    def get_device(self):
        return self.device
