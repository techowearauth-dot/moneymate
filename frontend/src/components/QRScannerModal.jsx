import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const QRScannerModal = ({ visible, onClose, onScan }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (visible && !permission?.granted) {
            requestPermission();
        }
    }, [visible]);

    const handleBarcodeScanned = ({ data }) => {
        if (!scanned) {
            setScanned(true);
            onScan(data);
            setTimeout(() => setScanned(false), 2000); // Prevent double scans
        }
    };

    if (!permission) return null;

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                {!permission.granted ? (
                    <View style={styles.permissionContainer}>
                        <Text style={styles.text}>We need your permission to show the camera</Text>
                        <TouchableOpacity style={styles.button} onPress={requestPermission}>
                            <Text style={styles.buttonText}>Grant Permission</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.camera}>
                        <CameraView 
                            style={StyleSheet.absoluteFill} 
                            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                            barcodeScannerSettings={{
                                barcodeTypes: ["qr"],
                            }}
                        />
                        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
                            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                            
                            <View style={styles.header}>
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <Ionicons name="close" size={30} color="#FFF" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>Scan UPI QR Code</Text>
                            </View>

                            <View style={styles.scannerFrame}>
                                <View style={styles.cornerTopLeft} />
                                <View style={styles.cornerTopRight} />
                                <View style={styles.cornerBottomLeft} />
                                <View style={styles.cornerBottomRight} />
                            </View>

                            <Text style={styles.instruction}>Align the QR code within the frame</Text>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        position: 'absolute',
        top: 60,
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 20,
    },
    closeBtn: {
        padding: 10,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 20,
    },
    scannerFrame: {
        width: 250,
        height: 250,
        borderWidth: 0,
        position: 'relative',
    },
    instruction: {
        color: '#FFF',
        marginTop: 40,
        fontSize: 14,
        opacity: 0.8,
    },
    cornerTopLeft: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderLeftWidth: 4,
        borderTopWidth: 4,
        borderColor: '#6366F1',
        top: 0,
        left: 0,
        borderTopLeftRadius: 20,
    },
    cornerTopRight: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRightWidth: 4,
        borderTopWidth: 4,
        borderColor: '#6366F1',
        top: 0,
        right: 0,
        borderTopRightRadius: 20,
    },
    cornerBottomLeft: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderLeftWidth: 4,
        borderBottomWidth: 4,
        borderColor: '#6366F1',
        bottom: 0,
        left: 0,
        borderBottomLeftRadius: 20,
    },
    cornerBottomRight: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRightWidth: 4,
        borderBottomWidth: 4,
        borderColor: '#6366F1',
        bottom: 0,
        right: 0,
        borderBottomRightRadius: 20,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        color: '#FFF',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default QRScannerModal;
