# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ============================================
# CAPACITOR & WEBVIEW RULES
# ============================================

# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Capacitor Bridge
-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

# Keep all plugins
-keep class com.capacitorjs.** { *; }
-keep class capacitor.** { *; }

# Keep Barcode Scanner
-keep class com.capacitor.community.barcodescanner.** { *; }

# Preserve line numbers for debugging
-keepattributes SourceFile,LineNumberTable

# Keep source file names
-renamesourcefileattribute SourceFile

# ============================================
# OPTIMIZATION RULES
# ============================================

# Remove logging in production (keeps APK small)
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Optimize code
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# Keep annotations
-keepattributes *Annotation*

# Keep generic signatures
-keepattributes Signature
