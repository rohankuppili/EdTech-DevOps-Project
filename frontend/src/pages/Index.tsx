import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Users, Award } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              EduPlatform
            </h1>
          </div>
          <Button onClick={() => navigate('/auth')}>
            Get Started
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Learn and Teach Online
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join our platform to access quality courses or share your knowledge with students worldwide
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Start Learning
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Become an Educator
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <div className="text-center p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Browse Courses</h3>
            <p className="text-muted-foreground">
              Access a wide variety of courses across different subjects and skill levels
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-4">
              <Award className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
            <p className="text-muted-foreground">
              Monitor your learning journey and celebrate your achievements
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
              <Users className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Courses</h3>
            <p className="text-muted-foreground">
              Share your expertise by creating and managing courses for students
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
