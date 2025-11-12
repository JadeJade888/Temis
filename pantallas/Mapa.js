import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const DEFAULT_REGION = {
    latitude: 20.6736,
    longitude: -103.3446,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

// Importar JSON 
const crimeData = require('../Datos.json');
const REPORT_COLLECTION = 'citizenReports';

const Mapa = () => {
    // Se usa initialRegion para la carga inicial, y luego el mapa es no controlado (libre de moverse)
    const [initialRegion, setInitialRegion] = useState(DEFAULT_REGION);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const mapRef = useRef(null);

    const [citizenReports, setCitizenReports] = useState([]);

    const { riskZones, statistics } = useMemo(() => {
        if (!dataLoaded) return { riskZones: [], statistics: {} };

        const coloniaCrimes = {};
        let processedCount = 0;

        crimeData.forEach(item => {
            if (processedCount > 10000) return;

            const key = Object.keys(item)[0];
            const values = item[key].split(',');

            if (values.length >= 9) {
                const colonia = values[4]?.replace(/"/g, '').trim();
                const municipio = values[5]?.replace(/"/g, '').trim();
                const x = parseFloat(values[2]?.replace(/"/g, ''));
                const y = parseFloat(values[3]?.replace(/"/g, ''));

                if (colonia && colonia !== "NO DISPONIBLE" && !isNaN(x) && !isNaN(y)) {
                    const coloniaKey = `${colonia}, ${municipio}`;

                    if (!coloniaCrimes[coloniaKey]) {
                        coloniaCrimes[coloniaKey] = {
                            colonia,
                            municipio,
                            crimeCount: 0,
                            coordinates: { longitude: x, latitude: y }
                        };
                    }

                    coloniaCrimes[coloniaKey].crimeCount++;
                    processedCount++;
                }
            }
        });

        const coloniasArray = Object.values(coloniaCrimes);

        if (coloniasArray.length === 0) {
            return { riskZones: [], statistics: {} };
        }

        coloniasArray.sort((a, b) => b.crimeCount - a.crimeCount);

        const totalColonias = coloniasArray.length;
        const highRiskThreshold = Math.ceil(totalColonias * 0.1);
        const mediumRiskThreshold = Math.ceil(totalColonias * 0.6);

        const riskZonesProcessed = coloniasArray.map((coloniaData, index) => {
            let riskLevel = 'bajo';

            if (index < highRiskThreshold && coloniaData.crimeCount > 1) {
                riskLevel = 'alto';
            } else if (index < mediumRiskThreshold && coloniaData.crimeCount > 0) {
                riskLevel = 'medio';
            }

            return {
                id: `${coloniaData.colonia}-${index}`,
                nombre: `${coloniaData.colonia}, ${coloniaData.municipio}`,
                tipo: riskLevel,
                coordenadas: coloniaData.coordinates,
                descripcion: `Zona con ${coloniaData.crimeCount} reporte${coloniaData.crimeCount > 1 ? 's' : ''} de delito grave`,
                crimeCount: coloniaData.crimeCount,
                radio: riskLevel === 'alto' ? 350 : riskLevel === 'medio' ? 250 : 150
            };
        });

        // Filtrado para mostrar solo zonas de riesgo medio y alto
        const filteredRiskZones = riskZonesProcessed.filter(zone =>
            zone.tipo === 'alto' || zone.tipo === 'medio'
        );

        const stats = {
            totalCrimes: coloniasArray.reduce((sum, colonia) => sum + colonia.crimeCount, 0),
            highRiskZones: filteredRiskZones.filter(zone => zone.tipo === 'alto').length,
            mediumRiskZones: filteredRiskZones.filter(zone => zone.tipo === 'medio').length,
            totalZones: filteredRiskZones.length,
            totalColonias: coloniasArray.length
        };

        return { riskZones: filteredRiskZones, statistics: stats };
    }, [dataLoaded]);

    const puntosSeguros = useMemo(() => [

        {
            id: 1,
            nombre: "Comisaría Centro Histórico",
            tipo: "policia",
            coordenadas: { latitude: 20.6765, longitude: -103.3468 },
            telefono: "333-123-4567"
        },
        {
            id: 2,
            nombre: "Hospital Civil Viejo",
            tipo: "hospital",
            coordenadas: { latitude: 20.6850, longitude: -103.3300 },
            telefono: "333-123-4571"
        },
        {
            id: 3,
            nombre: "Estación de Bomberos Centro",
            tipo: "bomberos",
            coordenadas: { latitude: 20.6900, longitude: -103.3500 },
            telefono: "333-123-4575"
        },
        {
            id: 4,
            nombre: "Comisaría Chapultepec",
            tipo: "policia",
            coordenadas: { latitude: 20.6710, longitude: -103.3720 },
            telefono: "333-123-4568"
        },
        {
            id: 5,
            nombre: "Hospital México Americano",
            tipo: "hospital",
            coordenadas: { latitude: 20.6800, longitude: -103.3800 },
            telefono: "333-123-4572"
        },


        {
            id: 6,
            nombre: "Comisaría Zapopan Centro",
            tipo: "policia",
            coordenadas: { latitude: 20.7200, longitude: -103.3900 },
            telefono: "333-123-4569"
        },
        {
            id: 7,
            nombre: "Hospital San Javier",
            tipo: "hospital",
            coordenadas: { latitude: 20.6900, longitude: -103.4300 },
            telefono: "333-123-4573"
        },
        {
            id: 8,
            nombre: "Cuartel de Bomberos Providencia",
            tipo: "bomberos",
            coordenadas: { latitude: 20.7150, longitude: -103.4050 },
            telefono: "333-123-4576"
        },
        {
            id: 9,
            nombre: "Centro Comercial Andares",
            tipo: "comercial",
            coordenadas: { latitude: 20.6900, longitude: -103.4200 },
            telefono: "333-123-4577"
        },


        {
            id: 10,
            nombre: "Comisaría Tlaquepaque",
            tipo: "policia",
            coordenadas: { latitude: 20.6400, longitude: -103.3100 },
            telefono: "333-123-4584"
        },
        {
            id: 11,
            nombre: "Hospital de Tlaquepaque",
            tipo: "hospital",
            coordenadas: { latitude: 20.6300, longitude: -103.3200 },
            telefono: "333-123-4585"
        },
        {
            id: 12,
            nombre: "Bomberos Tlaquepaque",
            tipo: "bomberos",
            coordenadas: { latitude: 20.6350, longitude: -103.3150 },
            telefono: "333-123-4586"
        },


        {
            id: 13,
            nombre: "Comisaría Tonalá",
            tipo: "policia",
            coordenadas: { latitude: 20.6200, longitude: -103.2400 },
            telefono: "333-123-4587"
        },
        {
            id: 14,
            nombre: "Centro de Salud Tonalá",
            tipo: "hospital",
            coordenadas: { latitude: 20.6250, longitude: -103.2450 },
            telefono: "333-123-4588"
        },


        {
            id: 15,
            nombre: "Comisaría Tlajomulco",
            tipo: "policia",
            coordenadas: { latitude: 20.4800, longitude: -103.4500 },
            telefono: "333-123-4589"
        },
        {
            id: 16,
            nombre: "Hospital Tlajomulco",
            tipo: "hospital",
            coordenadas: { latitude: 20.4750, longitude: -103.4400 },
            telefono: "333-123-4590"
        },


        {
            id: 17,
            nombre: "Comisaría El Salto",
            tipo: "policia",
            coordenadas: { latitude: 20.5200, longitude: -103.2000 },
            telefono: "333-123-4591"
        },
        {
            id: 18,
            nombre: "Centro Médico El Salto",
            tipo: "hospital",
            coordenadas: { latitude: 20.5250, longitude: -103.2050 },
            telefono: "333-123-4592"
        },


        {
            id: 19,
            nombre: "Policía Ixtlahuacán",
            tipo: "policia",
            coordenadas: { latitude: 20.3500, longitude: -103.2000 },
            telefono: "333-123-4593"
        },


        {
            id: 20,
            nombre: "Seguridad Juanacatlán",
            tipo: "policia",
            coordenadas: { latitude: 20.5100, longitude: -103.1700 },
            telefono: "333-123-4594"
        }
    ], []);

    const getReportColor = useCallback((category) => {
        if (category === 'Seguridad') {
            return '#e74c3c'; // Red (High risk)
        }
        return '#f39c12'; // Yellow/Orange (Medium risk)
    }, []);

    const getRecommendationsByRiskLevel = useCallback((riskLevel, crimeCount) => {
        const baseRecommendations = {
            alto: [
                `🚨 Zona de ALTO RIESGO con ${crimeCount} reportes`,
                "⛔ Evitar transitar solo/a después del anochecer",
                "🚖 Usar transporte autorizado y verificado",
                "💡 Mantenerse en áreas bien iluminadas",
                "📱 Informar a familiares de sus recorridos",
                "👥 Preferir caminar en grupo",
                "🔔 Estar alerta a comportamientos sospechosos"
            ],
            medio: [
                `⚠️ Zona con ${crimeCount} incidentes reportados`,
                "👀 Mantener atención constante al entorno",
                "📵 Evitar distracciones con dispositivos móviles",
                "🛣️ Caminar por rutas principales y conocidas",
                "📞 Tener números de emergencia a mano",
                "🌙 Aumentar precauciones durante la noche",
                "🗺️ Planificar rutas seguras por adelantado"
            ],
            bajo: [
                "✅ Zona con menor incidencia delictiva",
                "👁️ Mantener precauciones básicas de seguridad",
                "🎒 Cuidar pertenencias en áreas públicas",
                "📋 Seguir recomendaciones generales de seguridad",
                `📊 Se han registrado ${crimeCount} reporte${crimeCount > 1 ? 's' : ''} en esta zona`
            ]
        };

        return baseRecommendations[riskLevel] || baseRecommendations.bajo;
    }, []);

    const getZoneIcon = useCallback((tipo) => {
        switch (tipo) {
            case 'alto': return 'warning';
            case 'medio': return 'warning-outline';
            case 'bajo': return 'information-circle-outline';
            default: return 'help-circle-outline';
        }
    }, []);

    const getZoneColor = useCallback((tipo) => {
        switch (tipo) {
            case 'alto': return 'rgba(231, 76, 60, 0.3)';
            case 'medio': return 'rgba(243, 156, 18, 0.3)';
            case 'bajo': return 'rgba(39, 174, 96, 0.3)';
            default: return 'rgba(52, 152, 219, 0.2)';
        }
    }, []);

    const getZoneBorderColor = useCallback((tipo) => {
        switch (tipo) {
            case 'alto': return '#e74c3c';
            case 'medio': return '#f39c12';
            case 'bajo': return '#27ae60';
            default: return '#3498db';
        }
    }, []);

    const getSafePointIcon = useCallback((tipo) => {
        switch (tipo) {
            case 'policia': return 'shield-checkmark';
            case 'hospital': return 'medkit';
            case 'bomberos': return 'flame';
            case 'comercial': return 'business';
            default: return 'location';
        }
    }, []);

    const getSafePointColor = useCallback((tipo) => {
        switch (tipo) {
            case 'policia': return '#3498db';
            case 'hospital': return '#e74c3c';
            case 'bomberos': return '#f39c12';
            case 'comercial': return '#27ae60';
            default: return '#95a5a6';
        }
    }, []);

    const handleZonePress = useCallback((zone) => {
        setSelectedZone({
            ...zone,
            recomendaciones: getRecommendationsByRiskLevel(zone.tipo, zone.crimeCount),
            icon: getZoneIcon(zone.tipo)
        });
    }, [getRecommendationsByRiskLevel, getZoneIcon]);

    const handleReportPress = useCallback((report) => {
        // Center map on the pressed report
        if (mapRef.current && report.coordinates) {
            mapRef.current.animateToRegion({
                latitude: report.coordinates.latitude,
                longitude: report.coordinates.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);
        }

        const badgeColor = getReportColor(report.category);

        setSelectedZone({
            id: report.id,
            nombre: `Reporte: ${report.title}`,
            tipo: 'reporte',
            coordenadas: report.coordinates,
            descripcion: report.description,
            crimeCount: 1,
            radio: 100,
            recomendaciones: [`Categoría: ${report.category}`, `Ubicación: ${report.location}`, `Estado: ${report.status}`],
            icon: 'alert-circle',
            color: badgeColor,
            reportCategory: report.category
        });
    }, [getReportColor]);


    const centerOnUser = useCallback(() => {
        if (mapRef.current && userLocation) {
            mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            });
        } else {
            Alert.alert(
                'Ubicación no disponible',
                'No se pudo obtener tu ubicación actual. Asegúrate de tener el GPS encendido.'
            );
        }
    }, [userLocation]);

    useEffect(() => {
        setDataLoaded(true);

        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permiso de ubicación denegado. Usando ubicación predeterminada.');
                    setLoading(false);
                    // setInitialRegion(DEFAULT_REGION); // Ya es el valor inicial
                    return;
                }

                let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeout: 10000,
                });

                setUserLocation(location.coords);
                setInitialRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });

            } catch (error) {

                console.error("Error obteniendo ubicación GPS:", error);
                setErrorMsg('Error obteniendo ubicación. Usando ubicación predeterminada.');
                // setInitialRegion(DEFAULT_REGION); // Ya es el valor inicial

            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        const q = query(
            collection(db, REPORT_COLLECTION),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reportsList = [];
            snapshot.forEach((doc) => {
                const data = doc.data();

                // Firestore Geopoint Handling
                const coordsData = data.coordinates;
                const lat = coordsData?.latitude;
                const lng = coordsData?.longitude;

                if (coordsData && typeof lat === 'number' && typeof lng === 'number') {
                    reportsList.push({
                        id: doc.id,
                        ...data,
                        coordinates: { latitude: lat, longitude: lng } // Normalizar formato
                    });
                }
            });
            setCitizenReports(reportsList);
        }, (error) => {
            console.error("Error sincronizando reportes ciudadanos:", error);

        });

        return unsubscribe;
    }, []);


    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#49688d" />
                    <Text style={styles.loadingText}>Cargando mapa...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Mapa de Riesgo AMG</Text>
                <Text style={styles.subtitle}>
                    {riskZones.length > 0 ?
                        `${statistics.highRiskZones} zonas alto riesgo • ${statistics.mediumRiskZones} zonas riesgo medio` :
                        <Text>Cargando datos...</Text>
                    }
                    {' | '}
                    <Ionicons name="alert-circle" size={12} color="#e74c3c" />
                    {` ${citizenReports.length} Reportes en tiempo real`}
                </Text>
            </View>

            <View style={styles.mapContainer}>
                {initialRegion ? (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={initialRegion}
                        provider={PROVIDER_GOOGLE}
                        showsUserLocation={true}
                        showsMyLocationButton={false}
                        showsCompass={true}
                        zoomControlEnabled={false} 
                        zoomEnabled={true}
                        scrollEnabled={true}
                        loadingEnabled={true}
                        loadingIndicatorColor="#49688d"
                        loadingBackgroundColor="#f8f9fa"
                    >

                        {riskZones.map(zone => (
                            (zone.tipo === 'alto' || zone.tipo === 'medio') && (
                                <Circle
                                    key={zone.id}
                                    center={zone.coordenadas}
                                    radius={zone.radio}
                                    fillColor={getZoneColor(zone.tipo)}
                                    strokeColor={getZoneBorderColor(zone.tipo)}
                                    strokeWidth={1}
                                />
                            )
                        ))}

                        {riskZones.map(zone => (
                            (zone.tipo === 'alto' || zone.tipo === 'medio') && (
                                <Marker
                                    key={`marker-${zone.id}`}
                                    coordinate={zone.coordenadas}
                                    onPress={() => handleZonePress(zone)}
                                    tracksViewChanges={false}
                                >
                                    <View style={[styles.riskMarker, styles[`riskMarker${zone.tipo.charAt(0).toUpperCase() + zone.tipo.slice(1)}`]]}>
                                        <Ionicons
                                            name={getZoneIcon(zone.tipo)}
                                            size={16}
                                            color="#fff"
                                        />
                                    </View>
                                </Marker>
                            )
                        ))}

                        {citizenReports.map(report => (
                            <Marker
                                key={report.id}
                                coordinate={report.coordinates}
                                onPress={() => handleReportPress(report)}
                            >

                                <View style={[styles.reportMarker, { backgroundColor: getReportColor(report.category) }]}>
                                    <Ionicons name="alert-circle" size={16} color="#fff" />
                                </View>

                                <Callout tooltip={true} style={{ zIndex: 1 }}>
                                    <View style={styles.calloutContainer}>
                                        <Text style={styles.calloutTitle}>{report.title}</Text>
                                        <Text style={styles.calloutSubtitle}>Categoría: {report.category}</Text>
                                        <Text style={styles.calloutDescription} numberOfLines={1}>Ubicación: {report.location}</Text>
                                    </View>
                                </Callout>
                            </Marker>
                        ))}

                        {puntosSeguros.map(point => (
                            <Marker
                                key={`safe-${point.id}`}
                                coordinate={point.coordenadas}
                            >
                                <View style={[styles.safeMarker, { backgroundColor: getSafePointColor(point.tipo) }]}>
                                    <Ionicons
                                        name={getSafePointIcon(point.tipo)}
                                        size={16}
                                        color="#fff"
                                    />
                                </View>
                            </Marker>
                        ))}
                    </MapView>
                ) : (
                    <View style={styles.mapError}>
                        <Ionicons name="map-outline" size={50} color="#bdc3c7" />
                        <Text style={styles.mapErrorText}>
                            {errorMsg || 'No se pudo cargar el mapa'}
                        </Text>
                    </View>
                )}

                <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
                    <Ionicons name="locate" size={20} color="#49688d" />
                </TouchableOpacity>

                {riskZones.length > 0 && (
                    <View style={styles.generalInfoCard}>
                        <View style={styles.infoCard}>
                            <Ionicons name="analytics" size={18} color="#49688d" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoTitle}>Datos de Seguridad en Tiempo Real - AMG</Text>
                                <Text style={styles.infoText}>
                                    {statistics.totalCrimes} delitos históricos analizados • {citizenReports.length} reportes ciudadanos activos • {puntosSeguros.length} puntos seguros
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.symbologyOverlay}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.symbologyScrollContent}
                    >

                        <View style={styles.symbologySection}>
                            <Text style={styles.symbologySubtitle}>Zonas de Riesgo</Text>
                            <View style={styles.symbologyItems}>
                                <View style={styles.symbologyItem}>
                                    <View style={[styles.riskMarker, styles.riskMarkerAlto]}>
                                        <Ionicons name="warning" size={12} color="#fff" />
                                    </View>
                                    <Text style={styles.symbologyText}>Alto</Text>
                                </View>
                                <View style={styles.symbologyItem}>
                                    <View style={[styles.riskMarker, styles.riskMarkerMedio]}>
                                        <Ionicons name="warning-outline" size={12} color="#fff" />
                                    </View>
                                    <Text style={styles.symbologyText}>Medio</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.symbologySection}>
                            <Text style={styles.symbologySubtitle}>Reportes Ciudadanos</Text>
                            <View style={styles.symbologyItems}>
                                <View style={styles.symbologyItem}>
                                    <View style={[styles.reportMarkerSymbology, { backgroundColor: '#e74c3c' }]}>
                                        <Ionicons name="alert-circle" size={12} color="#fff" />
                                    </View>
                                    <Text style={styles.symbologyText}>Seguridad</Text>
                                </View>
                                <View style={styles.symbologyItem}>
                                    <View style={[styles.reportMarkerSymbology, { backgroundColor: '#f39c12' }]}>
                                        <Ionicons name="alert-circle" size={12} color="#fff" />
                                    </View>
                                    <Text style={styles.symbologyText}>Otros</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.symbologySection}>
                            <Text style={styles.symbologySubtitle}>Puntos Seguros</Text>
                            <View style={styles.symbologyItems}>
                                <View style={styles.symbologyItem}>
                                    <View style={[styles.safeMarker, { backgroundColor: '#3498db' }]}>
                                        <Ionicons name="shield-checkmark" size={12} color="#fff" />
                                    </View>
                                    <Text style={styles.symbologyText}>Policía</Text>
                                </View>
                                <View style={styles.symbologyItem}>
                                    <View style={[styles.safeMarker, { backgroundColor: '#e74c3c' }]}>
                                        <Ionicons name="medkit" size={12} color="#fff" />
                                    </View>
                                    <Text style={styles.symbologyText}>Hospital</Text>
                                </View>
                                <View style={styles.symbologyItem}>
                                    <View style={[styles.safeMarker, { backgroundColor: '#f39c12' }]}>
                                        <Ionicons name="flame" size={12} color="#fff" />
                                    </View>
                                    <Text style={styles.symbologyText}>Bomberos</Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {selectedZone && (
                    <View style={styles.infoPanel}>

                        <View style={styles.infoHeader}>
                            <View style={styles.zoneHeader}>
                                <Ionicons
                                    name={selectedZone.icon}
                                    size={20}
                                    color={selectedZone.tipo === 'reporte' ? selectedZone.color : getZoneBorderColor(selectedZone.tipo)}
                                />
                                <Text style={styles.zoneName} numberOfLines={2}>
                                    {selectedZone.nombre}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedZone(null)}>
                                <Ionicons name="close" size={20} color="#7f8c8d" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.recommendationsScroll} showsVerticalScrollIndicator={false}>
                            {selectedZone.tipo !== 'reporte' ? (
                                // Content for Risk Zones
                                <>
                                    <View style={[styles.riskBadge, styles[`riskBadge${selectedZone.tipo.charAt(0).toUpperCase() + selectedZone.tipo.slice(1)}`]]}>
                                        <Text style={styles.riskBadgeText}>
                                            {selectedZone.tipo.toUpperCase()} • {selectedZone.crimeCount} reporte{selectedZone.crimeCount > 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                    <Text style={styles.zoneDescription}>{selectedZone.descripcion}</Text>
                                    <Text style={styles.recommendationsTitle}>Recomendaciones de Seguridad:</Text>
                                </>
                            ) : (

                                <>
                                    <View style={[styles.riskBadge, { backgroundColor: selectedZone.color }]}>
                                        <Text style={styles.riskBadgeText}>
                                            REPORTE CIUDADANO • {selectedZone.reportCategory.toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={styles.zoneDescription}>{selectedZone.descripcion}</Text>
                                    <Text style={styles.recommendationsTitle}>Detalles del Reporte:</Text>
                                </>
                            )}

                            {selectedZone.recomendaciones.map((rec, index) => (
                                <View key={index} style={styles.recommendationItem}>
                                    <Ionicons
                                        name={selectedZone.tipo === 'reporte' ? "locate" : "checkmark-circle"}
                                        size={14}
                                        color={selectedZone.tipo === 'reporte' ? '#49688d' : '#27ae60'}
                                    />
                                    <Text style={styles.recommendationText}>{rec}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2c3e50',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: '#7f8c8d',
        textAlign: 'center',
        fontWeight: '500',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapError: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ecf0f1',
    },
    mapErrorText: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 10,
        textAlign: 'center',
    },
    centerButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#fff',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        zIndex: 10, 
    },

    generalInfoCard: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 80, 
        zIndex: 10,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 10,
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#49688d',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    infoContent: {
        flex: 1,
        marginLeft: 10,
    },
    infoTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 2,
    },
    infoText: {
        fontSize: 11,
        color: '#2c3e50',
        lineHeight: 14,
    },

    symbologyOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        height: 100,
        zIndex: 5, // Abajo del panel de info
    },
    symbologyScrollContent: {
        alignItems: 'flex-start',
    },
    symbologySection: {
        marginRight: 24,
        alignItems: 'flex-start',
    },
    symbologySubtitle: {
        fontSize: 10,
        fontWeight: '600',
        color: '#7f8c8d',
        marginBottom: 4,
    },
    symbologyItems: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    symbologyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        marginBottom: 4,
    },
    symbologyText: {
        fontSize: 11,
        color: '#2c3e50',
        marginLeft: 4,
    },
    riskMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    riskMarkerAlto: {
        backgroundColor: '#e74c3c',
    },
    riskMarkerMedio: {
        backgroundColor: '#f39c12',
    },
    reportMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        elevation: 5,
    },
    reportMarkerSymbology: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    infoPanel: {
        position: 'absolute',
        bottom: 0, // Se ajusta la posición para que esté sobre la simbología
        left: 12,
        right: 12,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        maxHeight: height * 0.45,
        zIndex: 20, // Asegura que esté al frente
        marginBottom: 100, // Deja espacio para que se vea la simbología
    },
    infoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    zoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    zoneName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c3e50',
        marginLeft: 8,
        flex: 1,
    },
    riskBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 10,
    },
    riskBadgeAlto: {
        backgroundColor: '#e74c3c',
    },
    riskBadgeMedio: {
        backgroundColor: '#f39c12',
    },
    riskBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    zoneDescription: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 10,
        lineHeight: 18,
    },
    recommendationsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
    },
    recommendationsScroll: {

    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    recommendationText: {
        fontSize: 12,
        color: '#2c3e50',
        marginLeft: 8,
        flex: 1,
        lineHeight: 16,
    },

    calloutContainer: {
        width: 250,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 4,
    },
    calloutSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#49688d',
    },
    calloutDescription: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#7f8c8d',
    },
});

export default Mapa;
