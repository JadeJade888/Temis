import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Menu_Principal({ navigation }) {
    // Función para manejar la navegación a diferentes módulos
    const handleNavigation = (screenName) => {
        navigation.navigate(screenName);
    };

    // Agregar botón de menú en el header
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.openDrawer()}
                    style={{ marginLeft: 15, padding: 8 }}
                >
                    <Ionicons name="menu" size={28} color="white" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <ScrollView 
                contentContainerStyle={styles.scrollContainer} 
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>TEMIS</Text>
                    </View>
                    <Text style={styles.subtitle}>Seguridad, precaución y prevención</Text>
                </View>

                <View style={styles.gridContainer}>
                    {/* Fila 1 */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.gridItem, styles.emergencyCard]}
                            onPress={() => handleNavigation('Boton_Emergencia')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, styles.emergencyIcon]}>
                                    <MaterialCommunityIcons name="alert-octagon" size={32} color="white" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.gridText}>Botón de Emergencia</Text>
                                    <Text style={styles.gridSubtext}>Ayuda inmediata</Text>
                                </View>
                                <View style={styles.arrowContainer}>
                                    <Ionicons name="chevron-forward" size={20} color="#e74c3c" />
                                </View>
                            </View>
                            <View style={[styles.cardBadge, styles.emergencyBadge]}>
                                <Text style={styles.badgeText}>URGENTE</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.gridItem, styles.mapCard]}
                            onPress={() => handleNavigation('Mapa')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, styles.mapIcon]}>
                                    <Ionicons name="map" size={28} color="white" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.gridText}>Mapa de Zonas</Text>
                                    <Text style={styles.gridSubtext}>Áreas de riesgo</Text>
                                </View>
                                <View style={styles.arrowContainer}>
                                    <Ionicons name="chevron-forward" size={20} color="#3498db" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Fila 2 */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.gridItem, styles.infoCard]}
                            onPress={() => handleNavigation('Modulo_Informativo')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, styles.infoIcon]}>
                                    <Ionicons name="information-circle" size={30} color="white" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.gridText}>Módulo Informativo</Text>
                                    <Text style={styles.gridSubtext}>Consejos de seguridad</Text>
                                </View>
                                <View style={styles.arrowContainer}>
                                    <Ionicons name="chevron-forward" size={20} color="#f39c12" />
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.gridItem, styles.reportCard]}
                            onPress={() => handleNavigation('Reportes_Ciudadanos')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, styles.reportIcon]}>
                                    <FontAwesome5 name="file-alt" size={24} color="white" />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.gridText}>Reportes Ciudadanos</Text>
                                    <Text style={styles.gridSubtext}>Reportar incidentes</Text>
                                </View>
                                <View style={styles.arrowContainer}>
                                    <Ionicons name="chevron-forward" size={20} color="#27ae60" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Información adicional */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoHeader}>
                        <Ionicons name="shield-checkmark" size={24} color="#49688d" />
                        <Text style={styles.infoTitle}>Información de Seguridad</Text>
                    </View>
                    <View style={styles.infoContent}>
                        <View style={styles.infoItem}>
                            <View style={[styles.infoIconContainer, styles.emergencyIcon]}>
                                <Ionicons name="call" size={16} color="white" />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Línea de Emergencia</Text>
                                <Text style={styles.infoValue}>911</Text>
                            </View>
                        </View>
                        <View style={styles.infoItem}>
                            <View style={[styles.infoIconContainer, styles.mapIcon]}>
                                <Ionicons name="location" size={16} color="white" />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Fiscalia de Jalisco</Text>
                                <Text style={styles.infoValue}>C. 14 2550, Colón Industrial, Gdl, Jal.</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 10,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontWeight: '800',
        fontSize: 42,
        color: '#2c3e50',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        textAlign: 'center',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    gridContainer: {
        marginBottom: 32,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    gridItem: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 20,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 20,
        paddingBottom: 25,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    emergencyIcon: {
        backgroundColor: '#e74c3c',
    },
    mapIcon: {
        backgroundColor: '#3498db',
    },
    infoIcon: {
        backgroundColor: '#f39c12',
    },
    reportIcon: {
        backgroundColor: '#27ae60',
    },
    textContainer: {
        alignItems: 'center',
        flex: 1,
    },
    gridText: {
        textAlign: 'center',
        fontSize: 15,
        color: '#2c3e50',
        fontWeight: '700',
        marginBottom: 4,
        lineHeight: 20,
    },
    gridSubtext: {
        textAlign: 'center',
        fontSize: 12,
        color: '#7f8c8d',
        fontWeight: '500',
        lineHeight: 16,
    },
    arrowContainer: {
        position: 'absolute',
        bottom: 12,
        right: 12,
    },
    // Card-specific styles
    emergencyCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#e74c3c',
    },
    mapCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#3498db',
    },
    infoCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#f39c12',
    },
    reportCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#27ae60',
    },
    cardBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    emergencyBadge: {
        backgroundColor: '#e74c3c',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    infoContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        marginLeft: 12,
    },
    infoContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#7f8c8d',
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '700',
    },
});
