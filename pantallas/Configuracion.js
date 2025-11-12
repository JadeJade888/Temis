import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Linking,
    SafeAreaView,
    StatusBar,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Configuracion = () => {
    const [settings, setSettings] = useState({
        ubicacion: true,
        camara: true,
        notificaciones: true,
        contactosEmergencia: true,
        datosPersonales: true,
        compartirUbicacion: true
    });

    const handleToggle = (setting) => {
        setSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    const handlePermissionsPress = () => {
        Alert.alert(
            "Configuración de Permisos",
            "Serás redirigido a la configuración de tu dispositivo para gestionar los permisos de la aplicación.",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Abrir Configuración",
                    onPress: () => Linking.openSettings()
                }
            ]
        );
    };

    const handleContactConfig = () => {
        Alert.alert(
            "Configuración de Contactos",
            "Aquí puedes configurar qué información de contacto se comparte en caso de emergencia.",
            [
                {
                    text: "Entendido",
                    style: "default"
                }
            ]
        );
    };

    const PermissionItem = ({ icon, title, description, value, onToggle, onPressSettings }) => (
        <View style={styles.permissionItem}>
            <View style={styles.permissionHeader}>
                <View style={styles.permissionTitleContainer}>
                    <Ionicons name={icon} size={22} color="#49688d" />
                    <View style={styles.permissionTextContainer}>
                        <Text style={styles.permissionTitle}>{title}</Text>
                        <Text style={styles.permissionDescription}>{description}</Text>
                    </View>
                </View>
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: '#767577', true: '#49688d' }}
                    thumbColor={value ? '#fff' : '#f4f3f4'}
                />
            </View>
            {onPressSettings && (
                <TouchableOpacity 
                    style={styles.settingsButton}
                    onPress={onPressSettings}
                >
                    <Ionicons name="settings-outline" size={14} color="#49688d" />
                    <Text style={styles.settingsButtonText}>Configurar en dispositivo</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const ContactPreferenceItem = ({ title, description, value, onToggle }) => (
        <View style={styles.contactItem}>
            <View style={styles.contactHeader}>
                <View style={styles.contactTextContainer}>
                    <Text style={styles.contactTitle}>{title}</Text>
                    <Text style={styles.contactDescription}>{description}</Text>
                </View>
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: '#767577', true: '#27ae60' }}
                    thumbColor={value ? '#fff' : '#f4f3f4'}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Configuración</Text>
                    <Text style={styles.subtitle}>
                        Gestiona tus preferencias y permisos de la aplicación
                    </Text>
                </View>

                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Permisos de la Aplicación Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="shield-checkmark" size={22} color="#2c3e50" />
                            <Text style={styles.sectionTitle}>Permisos de la Aplicación</Text>
                        </View>
                        
                        <PermissionItem
                            icon="location"
                            title="Ubicación"
                            description="Acceso a tu ubicación para servicios de emergencia"
                            value={settings.ubicacion}
                            onToggle={() => handleToggle('ubicacion')}
                            onPressSettings={handlePermissionsPress}
                        />
                        
                        <PermissionItem
                            icon="camera"
                            title="Cámara"
                            description="Permite tomar fotos para reportes ciudadanos"
                            value={settings.camara}
                            onToggle={() => handleToggle('camara')}
                            onPressSettings={handlePermissionsPress}
                        />
                        
                        <PermissionItem
                            icon="notifications"
                            title="Notificaciones"
                            description="Alertas y notificaciones de emergencia"
                            value={settings.notificaciones}
                            onToggle={() => handleToggle('notificaciones')}
                            onPressSettings={handlePermissionsPress}
                        />

                        <TouchableOpacity 
                            style={styles.permissionsButton}
                            onPress={handlePermissionsPress}
                        >
                            <Ionicons name="phone-portrait" size={18} color="#fff" />
                            <Text style={styles.permissionsButtonText}>
                                Gestionar todos los permisos en dispositivo
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Preferencias de Contacto Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="people" size={22} color="#2c3e50" />
                            <Text style={styles.sectionTitle}>Preferencias de Contacto</Text>
                        </View>
                        
                        <ContactPreferenceItem
                            title="Contactos de Emergencia"
                            description="Compartir información con contactos de emergencia"
                            value={settings.contactosEmergencia}
                            onToggle={() => handleToggle('contactosEmergencia')}
                        />
                        
                        <ContactPreferenceItem
                            title="Datos Personales"
                            description="Incluir información personal en alertas"
                            value={settings.datosPersonales}
                            onToggle={() => handleToggle('datosPersonales')}
                        />
                        
                        <ContactPreferenceItem
                            title="Compartir Ubicación"
                            description="Compartir ubicación en tiempo real con contactos"
                            value={settings.compartirUbicacion}
                            onToggle={() => handleToggle('compartirUbicacion')}
                        />

                        <TouchableOpacity 
                            style={styles.contactConfigButton}
                            onPress={handleContactConfig}
                        >
                            <Ionicons name="settings" size={16} color="#49688d" />
                            <Text style={styles.contactConfigButtonText}>
                                Configurar detalles de contacto
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Información Adicional */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle" size={20} color="#49688d" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoTitle}>Importante</Text>
                                <Text style={styles.infoText}>
                                    Algunos permisos son esenciales para el funcionamiento correcto de las funciones de emergencia. 
                                    Se recomienda mantener activados los permisos de ubicación y notificaciones.
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            TEMIS - Seguridad, precaución y prevención
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    header: {
        padding: 20,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2c3e50',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    section: {
        backgroundColor: '#fff',
        margin: 12,
        marginBottom: 8,
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        marginLeft: 10,
    },
    permissionItem: {
        backgroundColor: '#f8f9fa',
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
    },
    permissionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    permissionTitleContainer: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'flex-start',
    },
    permissionTextContainer: {
        flex: 1,
        marginLeft: 10,
    },
    permissionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 4,
    },
    permissionDescription: {
        fontSize: 13,
        color: '#7f8c8d',
        lineHeight: 16,
    },
    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(73, 104, 141, 0.1)',
        borderRadius: 6,
    },
    settingsButtonText: {
        fontSize: 11,
        color: '#49688d',
        fontWeight: '500',
        marginLeft: 4,
    },
    permissionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#49688d',
        padding: 14,
        borderRadius: 10,
        marginTop: 8,
    },
    permissionsButtonText: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginHorizontal: 8,
    },
    contactItem: {
        backgroundColor: '#f8f9fa',
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
    },
    contactHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    contactTextContainer: {
        flex: 1,
        marginRight: 10,
    },
    contactTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 4,
    },
    contactDescription: {
        fontSize: 13,
        color: '#7f8c8d',
        lineHeight: 16,
    },
    contactConfigButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#49688d',
        borderRadius: 8,
        marginTop: 8,
    },
    contactConfigButtonText: {
        color: '#49688d',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    infoSection: {
        margin: 12,
        marginTop: 8,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#e3f2fd',
        padding: 14,
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#49688d',
    },
    infoContent: {
        flex: 1,
        marginLeft: 10,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#2c3e50',
        lineHeight: 16,
    },
    footer: {
        alignItems: 'center',
        padding: 20,
        paddingBottom: 25,
    },
    footerText: {
        fontSize: 13,
        color: '#7f8c8d',
        textAlign: 'center',
        marginBottom: 6,
    },
    versionText: {
        fontSize: 11,
        color: '#bdc3c7',
    },
});

export default Configuracion;