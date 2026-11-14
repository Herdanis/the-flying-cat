// ============================================
// Dice Faces
// ============================================

pub fn pip(value: u8, ascii: bool) -> &'static str {
    match (value, ascii) {
        (1, false) => "⚀",
        (2, false) => "⚁",
        (3, false) => "⚂",
        (4, false) => "⚃",
        (5, false) => "⚄",
        (6, false) => "⚅",
        (1, true) => "[1]",
        (2, true) => "[2]",
        (3, true) => "[3]",
        (4, true) => "[4]",
        (5, true) => "[5]",
        _ => "[6]",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pips_cover_one_through_six() {
        for v in 1..=6u8 {
            assert!(!pip(v, false).is_empty());
            assert_eq!(pip(v, true).chars().count(), 3);
        }
    }

    #[test]
    fn pips_are_distinct() {
        let set: std::collections::HashSet<_> = (1..=6u8).map(|v| pip(v, false)).collect();
        assert_eq!(set.len(), 6);
    }
}
