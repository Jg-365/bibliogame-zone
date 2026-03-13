import { useEffect, useMemo, useState } from "react";
import { PROFILE_BANNER_PRESETS } from "@/features/profile/constants/bannerPresets";
import { supabase } from "@/integrations/supabase/client";

interface ProfileAppearanceState {
  bannerPresetId?: string;
  customBannerUrl?: string;
}

const getStorageKey = (userId?: string) => `rq:profile-appearance:${userId ?? "anonymous"}`;

const readAppearance = (userId?: string): ProfileAppearanceState => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProfileAppearanceState;
    return parsed ?? {};
  } catch {
    return {};
  }
};

const writeAppearance = (userId: string | undefined, state: ProfileAppearanceState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {
    // no-op: storage can be unavailable
  }
};

export const useProfileAppearance = (userId?: string) => {
  const [state, setState] = useState<ProfileAppearanceState>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setState(readAppearance(userId));
  }, [userId]);

  useEffect(() => {
    const loadFromBackend = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from("profiles")
        .select("banner_url, banner_preset_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!data) return;
      const backendState: ProfileAppearanceState = {
        customBannerUrl: data.banner_url ?? undefined,
        bannerPresetId: data.banner_preset_id ?? undefined,
      };
      setState((prev) => ({ ...prev, ...backendState }));
      writeAppearance(userId, { ...readAppearance(userId), ...backendState });
    };

    void loadFromBackend();
  }, [userId]);

  const bannerUrl = useMemo(() => {
    if (state.customBannerUrl) return state.customBannerUrl;
    if (!state.bannerPresetId) return null;
    return (
      PROFILE_BANNER_PRESETS.find((preset) => preset.id === state.bannerPresetId)?.imageUrl ?? null
    );
  }, [state.bannerPresetId, state.customBannerUrl]);

  const persist = async (nextState: ProfileAppearanceState) => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          banner_url: nextState.customBannerUrl ?? null,
          banner_preset_id: nextState.bannerPresetId ?? null,
        })
        .eq("user_id", userId);
    } finally {
      setIsSaving(false);
    }
  };

  const setBannerPreset = (presetId: string) => {
    setState((prev) => {
      const nextState: ProfileAppearanceState = {
        ...prev,
        bannerPresetId: presetId,
        customBannerUrl: prev.customBannerUrl,
      };
      writeAppearance(userId, nextState);
      void persist(nextState);
      return nextState;
    });
  };

  const setCustomBanner = (url: string) => {
    setState((prev) => {
      const nextState: ProfileAppearanceState = {
        ...prev,
        customBannerUrl: url,
      };
      writeAppearance(userId, nextState);
      void persist(nextState);
      return nextState;
    });
  };

  const clearCustomBanner = () => {
    setState((prev) => {
      const nextState: ProfileAppearanceState = {
        ...prev,
        customBannerUrl: undefined,
      };
      writeAppearance(userId, nextState);
      void persist(nextState);
      return nextState;
    });
  };

  return {
    bannerUrl,
    bannerPresetId: state.bannerPresetId,
    customBannerUrl: state.customBannerUrl,
    setBannerPreset,
    setCustomBanner,
    clearCustomBanner,
    isSaving,
  };
};
