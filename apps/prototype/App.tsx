import React, { useState } from 'react';
import { Image, Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ThemeProvider,
  useTheme,
  Text,
  Card,
  Icon,
  HStack,
  VStack,
  BottomNavigation,
  CategoryShape,
  ProfileScreen,
  type BottomNavItem,
  type CategoryShapeProps,
} from '@justlife/ui';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { HomeCleaningFunnel } from './screens/HomeCleaningFunnel';
import { ThankYou } from './screens/ThankYou';

// Mock homepage for the Expo prototype — its real job is to host and test the BottomNavigation natively.
// Tapping a tab switches the screen; scrolling the feed shrinks the floating bar (the Instagram pattern).
// Everything is tokenised via useTheme(); the bar sits on the real OS home-indicator inset (no web hacks).

const TABS: BottomNavItem[] = [
  { key: 'home', label: 'Home', icon: 'house' },
  { key: 'bookings', label: 'Bookings', icon: 'calendar-check', badge: 2 },
  { key: 'lifeplus', label: 'life+', icon: 'activity' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

// Brand verticals rendered with the real CategoryShape (organic brand shapes), not placeholder icons.
const CATEGORIES: { label: string; category: CategoryShapeProps['category'] }[] = [
  { label: 'Cleaning', category: 'clean' },
  { label: 'Salon', category: 'care' },
  { label: 'Wellness', category: 'heal' },
  { label: 'Handyman', category: 'assist' },
];

// Real, relevant, deterministic photos via loremflickr (keyword + lock). picsum (the drafts' source) is
// flaky, so this keeps the Expo app showing real images, not placeholder icon blocks.
const photo = (query: string, lock: number) => `https://loremflickr.com/240/240/${query}?lock=${lock}`;

const POPULAR = [
  { title: 'Home Cleaning', price: 'AED 88', rating: '4.8', query: 'cleaning', lock: 11 },
  { title: 'Deep Cleaning', price: 'AED 149', rating: '4.9', query: 'kitchen,clean', lock: 12 },
];

const RECENT = [
  { label: 'AC Maintenance', query: 'repair', lock: 21 },
  { label: 'Sofa Cleaning', query: 'sofa', lock: 22 },
  { label: 'Pest Control', query: 'spray', lock: 23 },
  { label: 'Painting', query: 'paint', lock: 24 },
];

/** Mock, non-functional search field (a card-styled row). */
function SearchField() {
  const t = useTheme();
  return (
    <HStack
      gap="sm"
      align="center"
      style={{
        backgroundColor: t.background.surface,
        borderRadius: t.radius.pill,
        borderWidth: t.borderWidth.thin,
        borderColor: t.border.default,
        paddingHorizontal: t.space.md,
        height: t.size['48'],
      }}
    >
      <Icon name="search" size="md" color={t.icon.secondary} />
      <Text variant="bodyBase" color="secondary">
        Search for a service
      </Text>
    </HStack>
  );
}

/** One category tile — the brand vertical's CategoryShape over a label. */
function CategoryTile({ label, category }: { label: string; category: CategoryShapeProps['category'] }) {
  const t = useTheme();
  return (
    <VStack gap="xs" align="center" style={{ width: '23%' }}>
      <CategoryShape category={category} size={t.size['56']} />
      <Text variant="labelXSmall" align="center" numberOfLines={1}>
        {label}
      </Text>
    </VStack>
  );
}

/** A popular-service card — real photo over title / rating / price. Tappable when `onPress` is given. */
function ServiceCard({
  title,
  price,
  rating,
  query,
  lock,
  onPress,
}: {
  title: string;
  price: string;
  rating: string;
  query: string;
  lock: number;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({ width: '48%', opacity: pressed && onPress ? 0.7 : 1 })}
    >
      <Card padded={false} style={{ overflow: 'hidden' }}>
        <Image source={{ uri: photo(query, lock) }} resizeMode="cover" style={{ width: '100%', height: t.size['96'] }} />
        <VStack gap="xs" style={{ padding: t.space.sm }}>
          <Text variant="labelBase" numberOfLines={1}>
            {title}
          </Text>
          <HStack gap="xs" align="center">
            <Icon name="star" size="sm" color={t.icon.warning} />
            <Text variant="bodyXSmall" color="secondary">
              {rating}
            </Text>
          </HStack>
          <Text variant="labelXSmall">{price}</Text>
        </VStack>
      </Card>
    </Pressable>
  );
}

/** The home feed. */
function HomeContent({ onOpenFunnel }: { onOpenFunnel: () => void }) {
  const t = useTheme();
  return (
    <VStack gap="lg">
      <VStack gap="xs">
        <Text variant="titleLarge">Good morning</Text>
        <HStack gap="xs" align="center">
          <Icon name="map-pin" size="sm" color={t.icon.brand} />
          <Text variant="bodyBase" color="secondary">
            Dubai Marina, Dubai
          </Text>
          <Icon name="chevron-down" size="sm" color={t.icon.secondary} />
        </HStack>
      </VStack>

      <SearchField />

      <VStack gap="sm">
        <Text variant="labelLarge">Categories</Text>
        <HStack justify="space-between">
          {CATEGORIES.map((c) => (
            <CategoryTile key={c.label} label={c.label} category={c.category} />
          ))}
        </HStack>
      </VStack>

      <View style={{ borderRadius: t.radius.lg, backgroundColor: t.background.brandSubtle, padding: t.space.md }}>
        <Text variant="labelLarge">30% off your first booking</Text>
        <Text variant="bodyBase" color="secondary">
          Use code WELCOME at checkout.
        </Text>
      </View>

      <VStack gap="sm">
        <Text variant="labelLarge">Popular services</Text>
        <HStack justify="space-between">
          {POPULAR.map((p) => (
            <ServiceCard
              key={p.title}
              title={p.title}
              price={p.price}
              rating={p.rating}
              query={p.query}
              lock={p.lock}
              onPress={p.title === 'Home Cleaning' ? onOpenFunnel : undefined}
            />
          ))}
        </HStack>
      </VStack>

      {/* Filler so there's something to scroll (drives the bar's shrink-on-scroll). */}
      <VStack gap="sm">
        <Text variant="labelLarge">Recently viewed</Text>
        {RECENT.map((r) => (
          <Card key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
            <Image source={{ uri: photo(r.query, r.lock) }} resizeMode="cover" style={{ width: t.size['40'], height: t.size['40'], borderRadius: t.radius.default }} />
            <Text variant="labelBase" style={{ flex: 1 }}>
              {r.label}
            </Text>
            <Icon name="chevron-right" size="sm" color={t.icon.secondary} />
          </Card>
        ))}
      </VStack>
    </VStack>
  );
}

/** Simple placeholder for the non-home tabs, so tapping the navbar visibly switches screens. */
function PlaceholderContent({ title, icon }: { title: string; icon: string }) {
  const t = useTheme();
  return (
    <VStack gap="sm" align="center" style={{ paddingTop: t.size['96'] }}>
      <View style={{ width: t.size['72'], height: t.size['72'], borderRadius: t.radius.pill, backgroundColor: t.background.secondary, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size="xl" color={t.icon.secondary} />
      </View>
      <Text variant="titleMedium">{title}</Text>
      <Text variant="bodyBase" color="secondary" align="center">
        Mock screen — tap the tabs below to test the navigation bar.
      </Text>
    </VStack>
  );
}

function Root({ onOpenFunnel }: { onOpenFunnel: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('home');
  const [compact, setCompact] = useState(false);

  // Shrink the floating bar once the feed scrolls (Instagram pattern).
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setCompact(e.nativeEvent.contentOffset.y > t.size['12']);
  };

  // Room below the content so the last items clear the floating bar (bar height + its inset + breathing).
  const navClearance = t.size['56'] + insets.bottom + t.space.xl;
  const active = TABS.find((x) => x.key === tab)!;

  // The Profile tab is the full shared ProfileScreen (the SAME component Storybook renders — no drift).
  // It brings its own bottom nav, wired back to setTab so the other tabs stay reachable.
  if (tab === 'profile') {
    return (
      <ProfileScreen
        name="Cem Mirkelam"
        phone="+971585235495"
        safeAreaTop={insets.top}
        safeAreaBottom={insets.bottom}
        activeTab="profile"
        onTabPress={setTab}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background.canvas }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + t.space.md,
          paddingHorizontal: t.space.md,
          paddingBottom: navClearance,
        }}
      >
        {tab === 'home' ? <HomeContent onOpenFunnel={onOpenFunnel} /> : <PlaceholderContent title={active.label} icon={active.icon} />}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
        <BottomNavigation
          items={TABS}
          activeKey={tab}
          onTabPress={setTab}
          compact={compact}
          safeAreaInset={insets.bottom}
        />
      </View>
    </View>
  );
}

/** Top-level navigator: tabbed home → Home Cleaning funnel → Thank-You, each pushed over the last. */
function AppShell() {
  const [route, setRoute] = useState<'home' | 'funnel' | 'thankyou'>('home');
  if (route === 'funnel') return <HomeCleaningFunnel onBack={() => setRoute('home')} onComplete={() => setRoute('thankyou')} />;
  if (route === 'thankyou') return <ThankYou leading="close" onLeadingPress={() => setRoute('home')} />;
  return <Root onOpenFunnel={() => setRoute('funnel')} />;
}

export default function App() {
  // Load Poppins under the exact face names `typographyToStyle` maps native weights to. Until they're
  // ready, render nothing (brief) so text never flashes in the system font.
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
  });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider themeName="light">
        <StatusBar style="dark" />
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
