// ============================================
// Sprites
// ============================================

// Single character used when two or more dinos share a square.
pub fn token_label(player_index: usize, crowded: bool) -> &'static str {
    const ALONE: [&str; 6] = ["🦕", "🦖", "🦎", "🐊", "🐢", "🐍"];
    const CROWDED: [&str; 6] = ["1", "2", "3", "4", "5", "6"];
    if crowded {
        CROWDED[player_index % CROWDED.len()]
    } else {
        ALONE[player_index % ALONE.len()]
    }
}

pub fn ascii_token(player_index: usize, crowded: bool) -> &'static str {
    const ALONE: [&str; 6] = ["D", "E", "F", "G", "H", "I"];
    if crowded {
        token_label(player_index, true)
    } else {
        ALONE[player_index % ALONE.len()]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn crowded_labels_are_single_characters() {
        for i in 0..6 {
            assert_eq!(token_label(i, true).chars().count(), 1);
            assert_eq!(ascii_token(i, true).chars().count(), 1);
        }
    }

    #[test]
    fn crowded_and_alone_labels_differ() {
        for i in 0..6 {
            assert_ne!(token_label(i, true), token_label(i, false));
        }
    }

    #[test]
    fn every_player_index_has_a_label() {
        for i in 0..6 {
            assert!(!token_label(i, false).is_empty());
            assert!(!ascii_token(i, false).is_empty());
        }
    }
}
