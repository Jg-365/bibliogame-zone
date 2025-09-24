import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Camera, Save, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const ProfileManager = () => {
  const { user } = useAuth();
  const { profile, updateProfile, isUpdating } =
    useProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || "",
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    avatar_url: profile?.avatar_url || "",
  });

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast({
        title: "Perfil atualizado!",
        description:
          "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description:
          "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simple file validation
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter menos de 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato inválido",
        description:
          "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64 for now (in production, upload to storage)
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

  if (!profile) {
    return <div>Carregando perfil...</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Gerenciar Perfil</CardTitle>
        <CardDescription>
          Atualize suas informações pessoais e foto de
          perfil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={
                isEditing
                  ? formData.avatar_url
                  : profile.avatar_url
              }
            />
            <AvatarFallback className="text-lg">
              {(formData.full_name || user?.email)
                ?.charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isEditing && (
            <div>
              <Label
                htmlFor="avatar-upload"
                className="cursor-pointer"
              >
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Camera className="h-4 w-4 mr-2" />
                    Alterar Foto
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
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">
              Nome de usuário
            </Label>
            <Input
              id="username"
              value={
                isEditing
                  ? formData.username
                  : profile.username || ""
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              disabled={!isEditing}
              placeholder="Seu nome de usuário"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              value={
                isEditing
                  ? formData.full_name
                  : profile.full_name || ""
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  full_name: e.target.value,
                }))
              }
              disabled={!isEditing}
              placeholder="Seu nome completo"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Biografia</Label>
          <Textarea
            id="bio"
            value={
              isEditing ? formData.bio : profile.bio || ""
            }
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                bio: e.target.value,
              }))
            }
            disabled={!isEditing}
            placeholder="Conte um pouco sobre você e seus gostos literários..."
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    username: profile?.username || "",
                    full_name: profile?.full_name || "",
                    bio: profile?.bio || "",
                    avatar_url: profile?.avatar_url || "",
                  });
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdating}
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? "Salvando..." : "Salvar"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Editar Perfil
            </Button>
          )}
        </div>

        {/* Stats Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">
            Estatísticas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {profile.total_books_read || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Livros Lidos
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {profile.total_pages_read || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Páginas Lidas
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {profile.current_streak || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Dias Seguidos
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {profile.reading_level || 1}
              </div>
              <div className="text-sm text-muted-foreground">
                Nível
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
