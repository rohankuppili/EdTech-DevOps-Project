import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, BookOpen, PlayCircle, FileText, Download, FileIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

interface BackendCourse {
  _id: string;
  title: string;
  description?: string;
  instructor?: { _id: string; name: string; email: string };
  lessons?: number;
  materials?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'document';
  completed: boolean;
}

const CourseDetail = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<BackendCourse | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/auth');
      return;
    }

    (async () => {
      // Load course details from backend list (no GET by id route)
      try {
        const list = await apiFetch<BackendCourse[]>('/courses');
        const foundCourse = list.find((c) => c._id === courseId);
        if (!foundCourse) {
          navigate('/student');
          return;
        }
        setCourse(foundCourse);
        // Generate lessons based on course lessons count or default to 10
        const lessonCount = foundCourse.lessons ?? 10;
        const generatedLessons: Lesson[] = Array.from({ length: lessonCount }, (_, i) => ({
          id: `${courseId}-lesson-${i + 1}`,
          title: `Lesson ${i + 1}: ${foundCourse.title} - Part ${i + 1}`,
          type: i % 2 === 0 ? 'video' : 'document',
          completed: false,
        }));
        // Load saved progress
        const savedProgress = localStorage.getItem(`course_progress_${user.id}_${courseId}`);
        if (savedProgress) {
          const completedLessons = JSON.parse(savedProgress);
          generatedLessons.forEach(lesson => {
            if (completedLessons.includes(lesson.id)) {
              lesson.completed = true;
            }
          });
        }
        setLessons(generatedLessons);
        updateProgress(generatedLessons);
      } catch (e) {
        navigate('/student');
        return;
      }
    })();
  }, [courseId, user, navigate]);

  const updateProgress = (currentLessons: Lesson[]) => {
    const completed = currentLessons.filter(l => l.completed).length;
    const total = currentLessons.length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    setProgress(progressPercent);

    // Update enrollment progress
    const enrollments = JSON.parse(localStorage.getItem(`enrollments_${user?.id}`) || '[]');
    const updatedEnrollments = enrollments.map((e: any) => {
      if (e.courseId === courseId) {
        return { ...e, progress: progressPercent, completedLessons: completed };
      }
      return e;
    });
    localStorage.setItem(`enrollments_${user?.id}`, JSON.stringify(updatedEnrollments));
  };

  const handleLessonToggle = (lessonId: string) => {
    const updatedLessons = lessons.map(lesson =>
      lesson.id === lessonId ? { ...lesson, completed: !lesson.completed } : lesson
    );
    setLessons(updatedLessons);
    updateProgress(updatedLessons);

    // Save progress
    const completedLessons = updatedLessons.filter(l => l.completed).map(l => l.id);
    localStorage.setItem(`course_progress_${user?.id}_${courseId}`, JSON.stringify(completedLessons));

    toast({
      title: updatedLessons.find(l => l.id === lessonId)?.completed ? 'Lesson completed!' : 'Lesson unchecked',
      description: `You've ${updatedLessons.find(l => l.id === lessonId)?.completed ? 'completed' : 'unchecked'} this lesson`,
    });
  };

  const handleDownload = (material: any) => {
    const link = document.createElement('a');
    link.href = material.url;
    link.download = material.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return <PlayCircle className="h-5 w-5 text-primary" />;
    if (type.startsWith('image/')) return <FileIcon className="h-5 w-5 text-secondary" />;
    return <FileText className="h-5 w-5 text-accent" />;
  };

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/student')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-3xl">{course.title}</CardTitle>
                <CardDescription className="text-base">by {course.instructor?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{course.description}</p>
                <div className="flex gap-4 text-sm">
                  <span>{course.lessons || 0} lessons</span>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
                <CardDescription>Click on lessons to mark them as complete</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleLessonToggle(lesson.id)}
                    >
                      <Checkbox
                        checked={lesson.completed}
                        onCheckedChange={() => handleLessonToggle(lesson.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {lesson.type === 'video' ? (
                            <PlayCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <FileText className="h-5 w-5 text-secondary" />
                          )}
                          <span className={lesson.completed ? 'line-through text-muted-foreground' : ''}>
                            {lesson.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {course.materials && course.materials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Study Materials</CardTitle>
                  <CardDescription>Download course resources and materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {course.materials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {getFileIcon(material.type)}
                          <div>
                            <p className="font-medium">{material.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(material.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(material)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Course Completion</span>
                    <span className="font-bold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Completed Lessons</span>
                    <span className="font-bold">
                      {lessons.filter(l => l.completed).length} / {lessons.length}
                    </span>
                  </div>
                </div>
                {progress === 100 && (
                  <div className="pt-4">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                      <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-semibold text-primary">Course Completed! 🎉</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Congratulations on finishing this course!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;
