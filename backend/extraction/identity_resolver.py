import re

# Explicit verified canonical mappings
KNOWN_MAPPINGS = {
    "AMIT KAKKAD": "Amit Kakkad",
    "PARAM JAIN": "Param Jain",
    "SHIKHAR VARSHNEY": "Shikhar Varshney",
    "vikas yadav": "Vikas Yadav",
    "Priyesh pawar": "Priyesh Pawar",
    "Samarpan A - Pankaj Sharma": "Pankaj Sharma",
    "Samarpan A Pankaj Sharma": "Pankaj Sharma",
    "Samarpan B - Paresh Panchal": "Paresh Panchal",
    "Samarpan B Paresh Panchal": "Paresh Panchal",
    "Jigar Kapadia Exotica": "Jigar Kapadia",
    "Piyush Gupta Exotica": "Piyush Gupta",
    "Dhruv Shah Sir": "Dhruv Shah",
    "Dhanraj G": "Dhanraj Gaikwad",
    "Shailesh Maliya": "Shailesh Mali",
}

# Players verified to be DISTINCT despite substring matches
PROVEN_DISTINCT = {
    ("Sagar", "Sagar Kapadia"),
    ("Shashi", "Shashikant Sharma"),
    ("Dr Anu", "Dr Ritesh"),
    ("Aryan Das", "Aryan Shetty"),
    ("Aryan Das", "Aryan Singh"),
    ("Aryan Shetty", "Aryan Singh"),
    ("Ameya Kamath", "Aditya Kamath"),
    ("Jash Bhatia", "Jayant Bhatia"),
    ("Smeet Shah", "Sneh Shah"),
    ("Atul Jain", "Anurag Jain"),
    ("Atul Jain", "Param Jain"),
}

def clean_raw_name(raw: str) -> str:
    """Removes annotations like (c), (wk), (RHB), (LHB) and trims spaces."""
    cleaned = re.sub(r'\s*\((?:c|wk|RHB|LHB)\)', '', raw)
    cleaned = re.sub(r'†', '', cleaned)
    return cleaned.strip()

def normalize_name(name: str) -> str:
    """Generates a normalized comparison key."""
    n = name.lower().strip()
    n = re.sub(r'^samarpan\s+[ab]\s*-?\s*', '', n)
    n = re.sub(r'\s+exotica$', '', n)
    n = re.sub(r'\s+sir$', '', n)
    n = re.sub(r'\s+', ' ', n)
    return n

class IdentityResolver:
    def __init__(self):
        self.raw_to_canonical = {}
        self.canonical_players = {} # canonical_name -> player_id
        self.next_id_num = 1

    def resolve(self, raw_input: str) -> tuple[str, str, str]:
        """
        Returns (canonical_name, player_id, resolution_status)
        """
        cleaned = clean_raw_name(raw_input)
        
        # 1. Check known explicit mappings
        if cleaned in KNOWN_MAPPINGS:
            canonical = KNOWN_MAPPINGS[cleaned]
            status = "AUTO_RESOLVED"
        elif raw_input in KNOWN_MAPPINGS:
            canonical = KNOWN_MAPPINGS[raw_input]
            status = "AUTO_RESOLVED"
        else:
            # 2. Check title case exact matches
            canonical = cleaned
            status = "AUTO_RESOLVED"

        # Check existing canonicals
        if canonical not in self.canonical_players:
            player_id = f"EPL-P-{self.next_id_num:03d}"
            self.canonical_players[canonical] = player_id
            self.next_id_num += 1
        else:
            player_id = self.canonical_players[canonical]

        self.raw_to_canonical[raw_input] = canonical
        return canonical, player_id, status
