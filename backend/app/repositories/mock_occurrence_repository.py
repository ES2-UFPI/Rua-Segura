import threading
from datetime import datetime
from typing import Dict, List, Optional

class InMemoryOccurrenceRepository:
    def __init__(self):
        self._lock = threading.Lock()
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

    def get_occurrence(self, occurrence_id: int) -> Optional[dict]:
        with self._lock:
            return self._occurrences.get(occurrence_id)

    def get_comments(self, occurrence_id: int) -> Optional[List[dict]]:
        with self._lock:
            if occurrence_id not in self._occurrences:
                return None
            return list(self._comments.get(occurrence_id, []))

    def add_comment(self, occurrence_id: int, content: str) -> Optional[dict]:
        with self._lock:
            if occurrence_id not in self._occurrences:
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

    def add_validation(self, occurrence_id: int, validation_type: str) -> Optional[dict]:
        with self._lock:
            occurrence = self._occurrences.get(occurrence_id)
            if not occurrence:
                return None
            
            if validation_type == "confirm":
                occurrence["confirmationsCount"] += 1
            elif validation_type == "contest":
                occurrence["contestationsCount"] += 1
            else:
                raise ValueError("Validation type must be 'confirm' or 'contest'")
                
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
