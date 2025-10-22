import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, LogOut, Plus, BookOpen, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

interface BackendCourse {
  _id: string;
  title: string;
  description?: string;
  instructor?: { _id: string; name: string; email: string };
  price?: number;
  tags?: string[];
  studentsEnrolled?: string[];
  duration?: string;
  lessons?: number;
  thumbnail?: string;
  materials?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
}

const EducatorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    lessons: '0',
    price: '0',
    tags: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'educator') {
      navigate('/auth');
      return;
    }

    loadCourses();
  }, [user, navigate]);

  const loadCourses = async () => {
    try {
      const list = await apiFetch<BackendCourse[]>('/courses');
      const mine = list.filter((c) => c.instructor?._id === user?.id);
      setCourses(mine);
    } catch (err) {
      toast({ title: 'Failed to load courses', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle thumbnail upload
    let thumbnailUrl = editingCourse?.thumbnail || '';
    if (thumbnailFile) {
      const reader = new FileReader();
      thumbnailUrl = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(thumbnailFile);
      });
    }

    // Handle materials upload
    const materials = editingCourse?.materials ? [...editingCourse.materials] : [];
    if (materialFiles.length > 0) {
      for (const file of materialFiles) {
        const reader = new FileReader();
        const fileUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        materials.push({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          url: fileUrl,
          size: file.size,
        });
      }
    }
    
    // Parse tags and price
    const parsedTags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const parsedPrice = Number(formData.price) || 0;

    if (editingCourse) {
      try {
        await apiFetch(`/courses/${editingCourse._id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            duration: formData.duration,
            lessons: Number(formData.lessons) || 0,
            price: parsedPrice,
            tags: parsedTags,
            thumbnail: thumbnailUrl,
            materials,
          }),
        });
        toast({ title: 'Course updated', description: 'Your course has been updated successfully' });
        await loadCourses();
      } catch (err) {
        toast({ title: 'Failed to update course', variant: 'destructive' });
      }
    } else {
      try {
        await apiFetch('/courses', {
          method: 'POST',
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            duration: formData.duration,
            lessons: Number(formData.lessons) || 0,
            price: parsedPrice,
            tags: parsedTags,
            thumbnail: thumbnailUrl,
            materials,
          }),
        });
        toast({ title: 'Course created', description: 'Your course has been created successfully' });
        await loadCourses();
      } catch (err) {
        toast({ title: 'Failed to create course', variant: 'destructive' });
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  // Editing to be implemented later

  const handleDelete = async (courseId: string) => {
    try {
      await apiFetch(`/courses/${courseId}`, { method: 'DELETE' });
      toast({ title: 'Course deleted', description: 'The course has been removed' });
      await loadCourses();
    } catch (err) {
      toast({ title: 'Failed to delete course', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration: '',
      lessons: '0',
      price: '0',
      tags: '',
    });
    setEditingCourse(null);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setMaterialFiles([]);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMaterialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMaterialFiles(files);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const openEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      duration: course.duration || '',
      lessons: String(course.lessons ?? 0),
      price: String(course.price ?? 0),
      tags: (course.tags || []).join(', '),
    });
    setThumbnailPreview('');
    setThumbnailFile(null);
    setMaterialFiles([]);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">EduPlatform</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Courses</h2>
            <p className="text-muted-foreground">Manage and create your courses</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                <DialogDescription>
                  {editingCourse ? 'Update your course details' : 'Add a new course to your platform'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Course Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        placeholder="e.g., math, beginner"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Course Thumbnail</Label>
                    <Input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                    />
                    {thumbnailPreview && (
                      <div className="mt-2">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="materials">Study Materials</Label>
                    <Input
                      id="materials"
                      type="file"
                      accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,image/*,video/*"
                      multiple
                      onChange={handleMaterialsChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload PDFs, documents, images, or videos (max 20MB per file)
                    </p>
                    {materialFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {materialFiles.map((file, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground">
                            • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 4 weeks"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lessons">Number of Lessons</Label>
                      <Input
                        id="lessons"
                        type="number"
                        min="0"
                        value={formData.lessons}
                        onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingCourse ? 'Update Course' : 'Create Course'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                You haven't created any courses yet. Click "Create Course" to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <BookOpen className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Instructor: {course.instructor?.name || 'You'}</p>
                    <p>Enrolled: {course.studentsEnrolled?.length || 0}</p>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openEdit(course)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDelete(course._id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );

}

export default EducatorDashboard;