import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface TagInputProps {
  label: string;
  placeholder?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}

/** Chip list with an add field — used for free-form tags like allergies or disliked ingredients. */
export function TagInput({ label, placeholder = 'Type and press add', tags, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function addTag() {
    const value = draft.trim();
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...tags, value]);
    setDraft('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      {tags.length > 0 && (
        <View style={styles.chipRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.chip}>
              <Text style={styles.chipText}>{tag}</Text>
              <Pressable onPress={() => removeTag(tag)} hitSlop={6}>
                <Feather name="x" size={12} color={theme.colors.brandDark} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          onSubmitEditing={addTag}
          returnKeyType="done"
        />
        <Pressable onPress={addTag} style={styles.addButton} disabled={!draft.trim()}>
          <Feather name="plus" size={16} color={draft.trim() ? theme.colors.brandDark : theme.colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.text.label,
    color: theme.colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  chipText: {
    ...theme.text.caption,
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.xs,
  },
  input: {
    flex: 1,
    ...theme.text.body,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
