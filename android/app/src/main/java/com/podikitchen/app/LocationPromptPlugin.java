package com.podikitchen.app;

import android.content.Context;
import android.content.Intent;
import android.location.LocationManager;
import android.provider.Settings;
import androidx.core.location.LocationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Bridges the site's "Use my current location" tap to Android's system
// Location settings screen when the device's location service is off —
// something the standard web Geolocation API called from the WebView has
// no way to do on its own. Uses only AndroidX core APIs already pulled in
// transitively (no extra dependency), so there's nothing new to break.
@CapacitorPlugin(name = "LocationPrompt")
public class LocationPromptPlugin extends Plugin {

    @PluginMethod
    public void ensureEnabled(PluginCall call) {
        LocationManager locationManager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        boolean enabled = locationManager != null && LocationManagerCompat.isLocationEnabled(locationManager);

        JSObject result = new JSObject();
        result.put("enabled", enabled);

        if (!enabled) {
            Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
            getActivity().startActivity(intent);
        }

        call.resolve(result);
    }
}
