import threading
from datetime import datetime
from typing import Dict, List, Optional, Union

class InMemoryOccurrenceRepository:
    def __init__(self):
        self._lock = threading.RLock()
        self._occurrences: Dict[int, dict] = {}
        self._comments: Dict[int, List[dict]] = {}
        self._next_comment_id = 1
        self._seed_data()

    def _seed_data(self):
        # Ocorrência inicial mockada conforme contrato
        self._occurrences[1] = {
            "id": 1,
            "category": "Assalto",
            "description": "Relato de movimentação suspeita na região.",
            "locationDescription": "Próximo à praça central",
            "createdAt": datetime.fromisoformat("2026-05-27T18:00:00"),
            "confirmationsCount": 3,
            "contestationsCount": 1,
            "communityStatus": "confirmed"
        }
        
        # Comentário inicial mockado conforme contrato
        self._comments[1] = [
            {
                "id": 1,
                "authorName": "Usuário anônimo",
                "content": "Passei por lá agora e ainda está perigoso.",
                "createdAt": datetime.fromisoformat("2026-05-27T18:30:00")
            }
        ]
        self._next_comment_id = 2

    def clear(self):
        with self._lock:
            self._occurrences.clear()
            self._comments.clear()
            self._next_comment_id = 1
            self._seed_data()

    def _normalize_id(self, occurrence_id: Union[int, str]) -> Union[int, str]:
        try:
            return int(occurrence_id)
        except (ValueError, TypeError):
            return occurrence_id

    def get_occurrence(self, occurrence_id: Union[int, str]) -> Optional[dict]:
        occurrence_id = self._normalize_id(occurrence_id)
        with self._lock:
            if occurrence_id not in self._occurrences:
                # Tenta buscar a ocorrência nas avaliações salvas no review_controller
                try:
                    from app.controllers.review_controller import _in_memory_repository
                    review = _in_memory_repository.find_by_id(str(occurrence_id))
                    if review:
                        self._occurrences[occurrence_id] = {
                            "id": occurrence_id,
                            "category": review.category,
                            "description": review.description,
                            "locationDescription": "Localizado nas coordenadas",
                            "createdAt": review.timestamp,
                            "confirmationsCount": 0,
                            "contestationsCount": 0,
                            "communityStatus": "pending"
                        }
                except Exception:
                    pass
            return self._occurrences.get(occurrence_id)

    def get_comments(self, occurrence_id: Union[int, str]) -> Optional[List[dict]]:
        occurrence_id = self._normalize_id(occurrence_id)
        with self._lock:
            if not self.get_occurrence(occurrence_id):
                return None
            return list(self._comments.get(occurrence_id, []))

    def add_comment(self, occurrence_id: Union[int, str], content: str) -> Optional[dict]:
        occurrence_id = self._normalize_id(occurrence_id)
        with self._lock:
            if not self.get_occurrence(occurrence_id):
                return None
            
            new_comment = {
                "id": self._next_comment_id,
                "authorName": "Usuário anônimo",
                "content": content,
                "createdAt": datetime.now()
            }
            self._next_comment_id += 1
            
            if occurrence_id not in self._comments:
                self._comments[occurrence_id] = []
            self._comments[occurrence_id].append(new_comment)
            return new_comment

    def add_validation(self, occurrence_id: Union[int, str], validation_type: str) -> Optional[dict]:
        occurrence_id = self._normalize_id(occurrence_id)
        with self._lock:
            occurrence = self.get_occurrence(occurrence_id)
            if not occurrence:
                return None
            
            if validation_type == "confirm":
                occurrence["confirmationsCount"] += 1
            elif validation_type == "contest":
                occurrence["contestationsCount"] += 1
            elif validation_type == "remove_confirm":
                if occurrence["confirmationsCount"] > 0:
                    occurrence["confirmationsCount"] -= 1
            elif validation_type == "remove_contest":
                if occurrence["contestationsCount"] > 0:
                    occurrence["contestationsCount"] -= 1
            else:
                raise ValueError("Validation type must be 'confirm', 'contest', 'remove_confirm' or 'remove_contest'")
                
            # Atualiza o communityStatus
            conf = occurrence["confirmationsCount"]
            cont = occurrence["contestationsCount"]
            if conf > cont:
                occurrence["communityStatus"] = "confirmed"
            elif cont > conf:
                occurrence["communityStatus"] = "contested"
            else:
                occurrence["communityStatus"] = "pending"
                
            return dict(occurrence)
