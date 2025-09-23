import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Search, Filter, MapPin, Plus } from 'lucide-react-native';
import { RootState } from '@/store/store';
import { useTheme } from '@/hooks/useTheme';
import { RestaurantMapModal } from '@/components/RestaurantMapModal';
import { CreateAdModal } from '@/components/CreateAdModal';

interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  validUntil: string;
  discount: string;
  restaurantName: string;
  category: 'food' | 'drinks';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const mockPromotions: Promotion[] = [
  {
    id: '1',
    title: '20% Off Coffee',
    description: 'Get 20% off your favorite coffee drinks',
    image:
      'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400',
    validUntil: '2025-02-28',
    discount: '20%',
    restaurantName: 'Café Central',
    category: 'drinks',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '123 Coffee Street, San Francisco, CA',
    },
  },
  {
    id: '2',
    title: 'Free Dessert',
    description: 'Free dessert with any main course',
    image:
      'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=400',
    validUntil: '2025-03-15',
    discount: 'FREE',
    restaurantName: 'Sweet Treats Bakery',
    category: 'food',
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
      address: '456 Dessert Avenue, San Francisco, CA',
    },
  },
];

export default function PromotionsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auth = useSelector((state: RootState) => state.auth);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);
  const [mapModalVisible, setMapModalVisible] = React.useState(false);
  const [selectedRestaurant, setSelectedRestaurant] =
    React.useState<Promotion | null>(null);
  const [createAdModalVisible, setCreateAdModalVisible] = React.useState(false);

  const isRestaurant = auth.user?.accountType === 'restaurant';
  const filters = [
    { key: 'food', label: t('promotions.food') },
    { key: 'drinks', label: t('promotions.drinks') },
    { key: 'nearby', label: t('promotions.nearby') },
    { key: 'newest', label: t('promotions.newest') },
    { key: 'popular', label: t('promotions.popular') },
  ];

  const filteredPromotions = mockPromotions.filter((promotion) => {
    const matchesSearch =
      promotion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promotion.restaurantName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    if (selectedFilters.length === 0) return matchesSearch;

    return (
      matchesSearch &&
      selectedFilters.some((filter) => {
        if (filter === 'food' || filter === 'drinks') {
          return promotion.category === filter;
        }
        return true; // For other filters like nearby, newest, popular
      })
    );
  });

  const toggleFilter = (filterKey: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterKey)
        ? prev.filter((f) => f !== filterKey)
        : [...prev, filterKey]
    );
  };

  const handleRestaurantLocation = (promotion: Promotion) => {
    setSelectedRestaurant(promotion);
    setMapModalVisible(true);
  };

  const renderPromotion = ({ item }: { item: Promotion }) => (
    <TouchableOpacity
      style={[styles.promotionCard, { backgroundColor: colors.surface }]}
      onPress={() => handleRestaurantLocation(item)}
    >
      <Image source={{ uri: item.image }} style={styles.promotionImage} />
      <View style={styles.promotionContent}>
        <View
          style={[styles.discountBadge, { backgroundColor: colors.secondary }]}
        >
          <Text style={styles.discountText}>{item.discount}</Text>
        </View>
        <View style={styles.restaurantHeader}>
          <Text style={[styles.restaurantName, { color: colors.primary }]}>
            {item.restaurantName}
          </Text>
          <TouchableOpacity onPress={() => handleRestaurantLocation(item)}>
            <MapPin size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.promotionTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.promotionDescription, { color: colors.textSecondary }]}
        >
          {item.description}
        </Text>
        <Text style={[styles.validUntil, { color: colors.primary }]}>
          {t('promotions.validUntil', { date: item.validUntil })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('promotions.title')}
          </Text>

          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('promotions.search')}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Filter size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.filtersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filtersRow}>
                  {filters.map((filter) => (
                    <TouchableOpacity
                      key={filter.key}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selectedFilters.includes(filter.key)
                            ? colors.primary
                            : colors.surface,
                        },
                      ]}
                      onPress={() => toggleFilter(filter.key)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          {
                            color: selectedFilters.includes(filter.key)
                              ? 'white'
                              : colors.text,
                          },
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {selectedFilters.length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.clearButton,
                        { backgroundColor: colors.error },
                      ]}
                      onPress={() => setSelectedFilters([])}
                    >
                      <Text style={styles.clearButtonText}>
                        {t('common.clear')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        <FlatList
          data={filteredPromotions}
          renderItem={renderPromotion}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {isRestaurant && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setCreateAdModalVisible(true)}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      )}
      {selectedRestaurant && (
        <RestaurantMapModal
          visible={mapModalVisible}
          onClose={() => setMapModalVisible(false)}
          restaurant={{
            name: selectedRestaurant.restaurantName,
            latitude: selectedRestaurant.location.latitude,
            longitude: selectedRestaurant.location.longitude,
            address: selectedRestaurant.location.address,
          }}
        />
      )}

      <CreateAdModal
        visible={createAdModalVisible}
        onClose={() => setCreateAdModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  promotionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  promotionImage: {
    width: '100%',
    height: 160,
  },
  promotionContent: {
    padding: 16,
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  promotionDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  validUntil: {
    fontSize: 12,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
