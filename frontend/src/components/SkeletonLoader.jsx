import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/colors';

export default function SkeletonLoader({ 
    width = '100%', 
    height = 20, 
    borderRadius = 4, 
    style 
}) {
    const opacityAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const animation = Animated.sequence([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0.4,
                duration: 800,
                useNativeDriver: true,
            })
        ]);

        Animated.loop(animation).start();
    }, []);

    return (
        <Animated.View 
            style={[
                styles.skeleton, 
                { width, height, borderRadius, opacity: opacityAnim }, 
                style
            ]} 
        />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: COLORS.disabled,
    }
});
