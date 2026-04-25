import torch
import torch.nn as nn

class FTTransformer(nn.Module):
    def __init__(
        self,
        num_features,
        dim,
        depth,
        heads,
        dim_head,
        attn_dropout=0.0,
        ff_dropout=0.0
    ):
        super().__init__()
        self.num_features = num_features

    def forward(self, x):
        return x
