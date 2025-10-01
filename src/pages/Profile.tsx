import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AccountResetManager } from "@/components/AccountResetManager";
import {
  User,
  Settings,
  BookOpen,
  Target,
  Flame,
  Star,
  Trophy,
  Calendar,
  TrendingUp,
  Edit,
  Camera,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const ProfilePage = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate level progress
  const getLevelProgress = () => {
    if (!profile) return 0;

    const currentLevel = profile.level || "Iniciante";
    const levels = [
      "Iniciante",
      "Leitor",
      "Entusiasta",
      "Especialista",
      "Mestre",
      "Lenda",
    ];
    const currentIndex = levels.indexOf(currentLevel);

    if (currentIndex === levels.length - 1) return 100;

    // Calculate progress based on points/books
    const baseProgress =
      (currentIndex / (levels.length - 1)) * 100;
    const extraProgress = (profile.points % 1000) / 10;

    return Math.min(baseProgress + extraProgress, 100);
  };

  const getNextLevelRequirement = () => {
    if (!profile)
      return "Complete mais livros para subir de nível";

    const currentLevel = profile.level || "Iniciante";
    const levels = [
      "Iniciante",
      "Leitor",
      "Entusiasta",
      "Especialista",
      "Mestre",
      "Lenda",
    ];
    const currentIndex = levels.indexOf(currentLevel);

    if (currentIndex === levels.length - 1)
      return "Nível máximo alcançado!";

    const nextLevel = levels[currentIndex + 1];
    const requiredBooks = (currentIndex + 1) * 5; // Example calculation
    const remainingBooks = Math.max(
      0,
      requiredBooks - (profile.books_completed || 0)
    );

    return `${remainingBooks} livros para ${nextLevel}`;
  };

  const stats = [
    {
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      label: "Livros Lidos",
      value: profile?.books_completed || 0,
      change: "+2 este mês",
    },
    {
      icon: <Target className="w-5 h-5 text-green-500" />,
      label: "Páginas Lidas",
      value: profile?.total_pages_read || 0,
      change: "+156 esta semana",
    },
    {
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      label: "Sequência Atual",
      value: profile?.current_streak || 0,
      change: profile?.current_streak
        ? "dias seguidos"
        : "Comece hoje!",
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      label: "Pontos XP",
      value: profile?.points || 0,
      change: `Nível ${profile?.level || "Iniciante"}`,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 pt-16 md:pt-20 pb-20 md:pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-300 rounded w-1/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-300 rounded w-full" />
                    <div className="h-4 bg-gray-300 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 pt-16 md:pt-20 pb-20 md:pb-8">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-600/10" />
            <CardContent className="relative p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                    <AvatarImage
                      src={user?.user_metadata?.avatar_url}
                    />
                    <AvatarFallback className="text-2xl">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-3">
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {profile?.username ||
                        user?.email?.split("@")[0] ||
                        "Leitor"}
                    </h1>
                    <Badge
                      variant="secondary"
                      className="w-fit mx-auto md:mx-0"
                    >
                      <Award className="w-3 h-3 mr-1" />
                      {profile?.level || "Iniciante"}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground">
                    Membro desde{" "}
                    {user?.created_at
                      ? format(
                          new Date(user.created_at),
                          "MMMM 'de' yyyy",
                          { locale: ptBR }
                        )
                      : "recentemente"}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso do Nível</span>
                      <span className="text-muted-foreground">
                        {Math.round(getLevelProgress())}%
                      </span>
                    </div>
                    <Progress
                      value={getLevelProgress()}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {getNextLevelRequirement()}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="shrink-0"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
            >
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.5,
                    }}
                    className="mb-2 flex justify-center"
                  >
                    {stat.icon}
                  </motion.div>
                  <p className="text-2xl font-bold text-primary">
                    {typeof stat.value === "number"
                      ? stat.value.toLocaleString()
                      : stat.value}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-xs text-green-600">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Profile Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="overview"
                className="flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="flex items-center space-x-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Conquistas</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="overview"
              className="space-y-6 mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Atividade Recente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>
                        Suas atividades recentes aparecerão
                        aqui
                      </p>
                      <p className="text-sm">
                        Comece lendo um livro para ver seu
                        progresso!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="achievements"
              className="space-y-6 mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Suas Conquistas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Suas conquistas aparecerão aqui</p>
                    <p className="text-sm">
                      Continue lendo para desbloquear novas
                      conquistas!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="settings"
              className="space-y-6 mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Configurações da Conta</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Informações Pessoais
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">
                            Email
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Nome de usuário
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {profile?.username ||
                              "Não definido"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4 text-red-600">
                        Zona de Perigo
                      </h3>
                      <AccountResetManager />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};
