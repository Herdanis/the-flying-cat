// ============================================
// Sprites
// ============================================

// A square holding more than one dino shows one compact marker per player.
// The marker is a circled digit so it can never be mistaken for a square
// number, which matters at the start when everyone sits on Earth.
const CROWDED: [&str; 6] = ["①", "②", "③", "④", "⑤", "⑥"];
const CROWDED_ASCII: [&str; 6] = ["1", "2", "3", "4", "5", "6"];

// A lone dino is drawn as a single column-wide glyph. The emoji dinosaur is
// double width in most terminals, which shifts the rest of the row.
const ALONE: [&str; 6] = ["d", "e", "f", "g", "h", "i"];

pub fn token_label(player_index: usize, crowded: bool) -> &'static str {
    if crowded {
        CROWDED[player_index % CROWDED.len()]
    } else {
        ALONE[player_index % ALONE.len()]
    }
}

pub fn ascii_token(player_index: usize, crowded: bool) -> &'static str {
    if crowded {
        CROWDED_ASCII[player_index % CROWDED_ASCII.len()]
    } else {
        ALONE[player_index % ALONE.len()]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_label_is_exactly_one_column_wide() {
        // A wider glyph would push the rest of the row out of alignment.
        for i in 0..6 {
            assert_eq!(token_label(i, true).chars().count(), 1);
            assert_eq!(token_label(i, false).chars().count(), 1);
            assert_eq!(ascii_token(i, true).chars().count(), 1);
            assert_eq!(ascii_token(i, false).chars().count(), 1);
        }
    }

    #[test]
    fn crowded_and_alone_labels_differ() {
        for i in 0..6 {
            assert_ne!(token_label(i, true), token_label(i, false));
            assert_ne!(ascii_token(i, true), ascii_token(i, false));
        }
    }

    #[test]
    fn no_player_marker_can_be_read_as_a_square_number() {
        // Digits 1-6 are square numbers; the alone markers must not be digits.
        for i in 0..6 {
            assert!(
                !token_label(i, false).chars().all(|c| c.is_ascii_digit()),
                "alone marker {} looks like a square number",
                token_label(i, false)
            );
        }
    }

    #[test]
    fn every_player_index_has_a_distinct_alone_label() {
        let set: std::collections::HashSet<_> = (0..6).map(|i| token_label(i, false)).collect();
        assert_eq!(set.len(), 6);
    }
}
