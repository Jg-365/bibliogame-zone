import React, { useEffect, useState } from "react";
import { Camera, Eraser, ImagePlus, RefreshCw, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useProfile } from "@/hooks/useProfile";
import { useProfileAppearance } from "@/hooks/useProfileAppearance";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { useToast } from "@/hooks/use-toast";
import { PROFILE_BANNER_PRESETS } from "@/features/profile/constants/bannerPresets";
import { calculateReadingPoints, formatProfileLevel } from "@/shared/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const ProfileManager = () => {
  const { user } = useAuth();
  const { books = [] } = useBooks();
  const { sessions = [] } = useReadingSessions();
  const { toast } = useToast();
  const { profile, updateProfile, isUpdating, forceRefresh, recomputeFromSessions } = useProfile();
  const {
    bannerUrl,
    bannerPresetId,
    customBannerUrl,
    setBannerPreset,
    setCustomBanner,
    clearCustomBanner,
  } = useProfileAppearance(user?.id);

  const [isEditing, setIsEditing] = useState(false);
  const [avatarFit, setAvatarFit] = useState<"cover" | "contain">("cover");
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
      });
    }

    try {
      const stored = localStorage.getItem("rq_avatar_fit");
      if (stored === "contain" || stored === "cover") setAvatarFit(stored);
    } catch {
      // no-op
    }
  }, [profile]);

  const completedBooksCount = books.filter((book) => book.status === "completed").length;
  const totalPagesRead = sessions.reduce(
    (sum, session) => sum + Math.max(0, session.pages_read || 0),
    0,
  );
  const points = calculateReadingPoints({
    totalPagesRead,
    booksCompleted: completedBooksCount,
  });
  const level = formatProfileLevel({ total_pages_read: totalPagesRead });

  const handleSave = async () => {
    try {
      if (!formData.username.trim()) {
        toast({
          title: "Nome de usuario obrigatorio",
          description: "Preencha o nome de usuario para salvar.",
          variant: "destructive",
        });
        return;
      }

      await updateProfile(formData);
      setIsEditing(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar alteracoes.";
      toast({
        title: "Erro ao atualizar perfil",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato invalido",
        description: "Selecione uma imagem valida.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A foto de perfil precisa ter menos de 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        avatar_url: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato invalido",
        description: "Selecione uma imagem para o banner.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O banner precisa ter menos de 8MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;
      setCustomBanner(result);
      toast({
        title: "Banner atualizado",
        description: "Seu banner personalizado foi salvo com sucesso.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRecompute = async () => {
    const ok = window.confirm(
      "Recalcular estatisticas com base nas sessoes de leitura? Isso atualiza paginas, livros concluidos e pontos.",
    );
    if (!ok) return;
    try {
      setIsRecomputing(true);
      await recomputeFromSessions?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Nao foi possivel recalcular.";
      toast({
        title: "Erro ao recalcular",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsRecomputing(false);
    }
  };

  if (!profile) {
    return <div>Carregando perfil...</div>;
  }

  return (
    <Card className="mx-auto w-full max-w-2xl border-border/70">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Gerenciar perfil</CardTitle>
            <CardDescription>
              Edite seu perfil, escolha banner e revise estatisticas reais.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={forceRefresh}
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={isEditing ? formData.avatar_url : profile.avatar_url || ""}
              className={avatarFit === "contain" ? "object-contain" : "object-cover"}
            />
            <AvatarFallback className="text-lg">
              {(formData.full_name || user?.email)?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {isEditing ? (
            <div className="min-w-0">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Camera className="mr-2 h-4 w-4" />
                    Alterar foto
                  </span>
                </Button>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="mt-2">
                <Label htmlFor="avatar-fit" className="text-xs">
                  Ajuste da foto
                </Label>
                <select
                  id="avatar-fit"
                  value={avatarFit}
                  onChange={(e) => {
                    const value = e.target.value as "cover" | "contain";
                    setAvatarFit(value);
                    try {
                      localStorage.setItem("rq_avatar_fit", value);
                    } catch {
                      // no-op
                    }
                  }}
                  className="mt-1 block w-full rounded-md border px-2 py-1 text-sm sm:w-auto"
                >
                  <option value="cover">Cortar</option>
                  <option value="contain">Ajustar</option>
                </select>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Banner do perfil</h3>
            <p className="text-xs text-muted-foreground">
              Escolha um banner da biblioteca ou envie uma foto personalizada.
            </p>
          </div>

          <div className="relative h-28 overflow-hidden rounded-[var(--radius-lg)] border border-border/70">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Preview do banner"
                className="h-full w-full object-cover dark:brightness-90 dark:contrast-110"
              />
            ) : (
              <div className="h-full w-full bg-card-pattern" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/35 to-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PROFILE_BANNER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setBannerPreset(preset.id)}
                className={`group overflow-hidden rounded-[var(--radius-md)] border text-left transition ${
                  bannerPresetId === preset.id && !customBannerUrl
                    ? "border-primary shadow-sm shadow-primary/30"
                    : "border-border/70 hover:border-primary/40"
                }`}
              >
                <img
                  src={preset.imageUrl}
                  alt={preset.name}
                  className="h-14 w-full object-cover transition-transform duration-300 group-hover:scale-105 dark:brightness-90"
                />
                <div className="px-2 py-1.5 text-xs font-medium">{preset.name}</div>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="banner-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Enviar foto
                </span>
              </Button>
            </Label>
            <Input
              id="banner-upload"
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
            />
            {customBannerUrl ? (
              <Button variant="ghost" size="sm" onClick={clearCustomBanner}>
                <Eraser className="mr-2 h-4 w-4" />
                Remover foto custom
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Nome de usuario</Label>
            <Input
              id="username"
              value={isEditing ? formData.username : profile.username || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              disabled={!isEditing}
              placeholder="Seu nome de usuario"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              value={isEditing ? formData.full_name : profile.full_name || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              disabled={!isEditing}
              placeholder="Seu nome completo"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Biografia</Label>
          <Textarea
            id="bio"
            value={isEditing ? formData.bio : profile.bio || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
            disabled={!isEditing}
            placeholder="Conte um pouco sobre voce e seus gostos literarios."
            rows={4}
          />
        </div>

        <div className="flex justify-end space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    username: profile.username || "",
                    full_name: profile.full_name || "",
                    bio: profile.bio || "",
                    avatar_url: profile.avatar_url || "",
                  });
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                <Save className="mr-2 h-4 w-4" />
                {isUpdating ? "Salvando..." : "Salvar"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Editar perfil</Button>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleRecompute} disabled={isRecomputing}>
            {isRecomputing ? "Recalculando..." : "Recalcular a partir das sessoes"}
          </Button>
        </div>

        <div className="border-t pt-6">
          <h3 className="mb-4 text-lg font-semibold">Estatisticas</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{completedBooksCount}</div>
              <div className="text-sm text-muted-foreground">Livros lidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalPagesRead}</div>
              <div className="text-sm text-muted-foreground">Paginas lidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{profile.current_streak || 0}</div>
              <div className="text-sm text-muted-foreground">Dias seguidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{points}</div>
              <div className="text-sm text-muted-foreground">Pontos</div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">Nivel atual: {level}</p>
        </div>
      </CardContent>
    </Card>
  );
};
