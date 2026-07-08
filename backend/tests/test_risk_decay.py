import pytest
from datetime import datetime, timezone, timedelta
from app.models.location_review import LocationReview
from app.services.risk_strategy import HeuristicRiskStrategy

def test_heuristic_strategy_spatial_decay():
    """Valida se ocorrências mais distantes têm seu risco atenuado corretamente"""
    strategy = HeuristicRiskStrategy()
    
    # 1. Distância = 0 metros (Sem atenuação)
    # Assalto tem peso base 3. Peso efetivo = 3 * 1.0 = 3
    review_on_route = LocationReview(
        id="1",
        category="Assalto",
        description="Assalto na rota",
        latitude=-5.0870,
        longitude=-42.8080,
        timestamp=datetime.now(timezone.utc)
    )
    review_on_route.distance_from_route = 0.0
    
    _, score_on = strategy.calculate([review_on_route])
    assert score_on == 3
    
    # 2. Distância = 50 metros (Meio caminho do raio de 100m, decaimento de 50%)
    # Peso efetivo = 3 * (1.0 - 50/100) = 1.5. Arredondado = 2
    review_mid_route = LocationReview(
        id="2",
        category="Assalto",
        description="Assalto a 50m",
        latitude=-5.0870,
        longitude=-42.8080,
        timestamp=datetime.now(timezone.utc)
    )
    review_mid_route.distance_from_route = 50.0
    
    _, score_mid = strategy.calculate([review_mid_route])
    assert score_mid == 2
    
    # 3. Distância = 90 metros (Decaimento de 90%)
    # Peso efetivo = 3 * (1.0 - 90/100) = 0.3. Arredondado = 0
    review_far_route = LocationReview(
        id="3",
        category="Assalto",
        description="Assalto a 90m",
        latitude=-5.0870,
        longitude=-42.8080,
        timestamp=datetime.now(timezone.utc)
    )
    review_far_route.distance_from_route = 90.0
    
    _, score_far = strategy.calculate([review_far_route])
    assert score_far == 0


def test_heuristic_strategy_temporal_decay():
    """Valida se ocorrências mais antigas têm seu risco atenuado com o passar do tempo"""
    strategy = HeuristicRiskStrategy()
    
    # 1. Registro recente (0 dias) -> Sem atenuação temporal
    # Assalto tem peso base 3. Peso efetivo = 3
    review_recent = LocationReview(
        id="1",
        category="Assalto",
        description="Assalto recente",
        latitude=-5.0870,
        longitude=-42.8080,
        timestamp=datetime.now(timezone.utc)
    )
    review_recent.distance_from_route = 0.0
    
    _, score_recent = strategy.calculate([review_recent])
    assert score_recent == 3

    # 2. Registro com 30 dias de idade (Exata meia-vida da ocorrência)
    # Peso efetivo cai pela metade: 3 * 0.5 = 1.5. Arredondado = 2
    review_30_days = LocationReview(
        id="2",
        category="Assalto",
        description="Assalto de 30 dias atrás",
        latitude=-5.0870,
        longitude=-42.8080,
        timestamp=datetime.now(timezone.utc) - timedelta(days=30)
    )
    review_30_days.distance_from_route = 0.0
    
    _, score_30 = strategy.calculate([review_30_days])
    assert score_30 == 2

    # 3. Registro com 90 dias de idade (Três meias-vidas, atenuação severa)
    # Peso efetivo = 3 * (0.5)^3 = 3 * 0.125 = 0.375. Arredondado = 0
    review_90_days = LocationReview(
        id="3",
        category="Assalto",
        description="Assalto antigo",
        latitude=-5.0870,
        longitude=-42.8080,
        timestamp=datetime.now(timezone.utc) - timedelta(days=90)
    )
    review_90_days.distance_from_route = 0.0
    
    _, score_90 = strategy.calculate([review_90_days])
    assert score_90 == 0