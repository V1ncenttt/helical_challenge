import torch
import torch.nn as nn

class ClassificationHead(nn.Module):
    
    def __init__(self, input_shape, num_classes):
        """Initialize the classification head.
        Args:
            input_shape (int): Dimensionality of the input features.
            num_classes (int): Number of output classes for classification.
        """
        
        super(ClassificationHead, self).__init__()
        self.layer1 = nn.Linear(input_shape, 128)
        self.layer2 = nn.Linear(128, 32)
        self.layer3 = nn.Linear(32, num_classes)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.4)

    def forward(self, x):
        """Forward pass through the classification head.
        Args:
            x (torch.Tensor): Input tensor of shape (batch_size, input_dim).
        Returns:
            torch.Tensor: Output tensor of shape (batch_size, num_classes) with class probabilities.
        """
        
        x = self.layer1(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.layer2(x)
        x = self.relu(x)
        x = self.dropout(x)
        x = self.layer3(x)
        return x
    
        