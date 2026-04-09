import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

import { routes } from '@/constants/routes';
import { spacing, useAppColors } from '@/theme';

type AppTopBarProps = {
  title: string;
  fallbackHref?: Href;
};

export function AppTopBar({ title, fallbackHref = routes.home }: AppTopBarProps) {
  const appColors = useAppColors();

  return (
    <View style={[styles.container, { borderBottomColor: appColors.border }]}>
      <View style={styles.side}>
        <IconButton
          icon="chevron-left"
          size={22}
          iconColor={appColors.text}
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace(fallbackHref);
          }}
        />
      </View>
      <Text variant="titleMedium" numberOfLines={1} style={[styles.title, { color: appColors.text }]}>{title}</Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    margin: 0,
    marginLeft: -8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
  },
});
