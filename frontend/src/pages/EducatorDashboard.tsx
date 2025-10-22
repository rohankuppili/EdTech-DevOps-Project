import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const { user, logout, isLoading } = useAuth();
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
  // derived thumbnails from tag selection
  const [linkMaterials, setLinkMaterials] = useState<Array<{ id: string; type: string; url: string; name: string; size?: number }>>([]);
  const [newYouTubeUrl, setNewYouTubeUrl] = useState('');
  const [newYouTubeTitle, setNewYouTubeTitle] = useState('');
  const [newDriveUrl, setNewDriveUrl] = useState('');
  const [newDriveTitle, setNewDriveTitle] = useState('');

  const TAGS = ['Math', 'Science', 'Programming', 'Design', 'Others'] as const;

  const getTagThumbnail = (tag: string) => {
    const safe = (s: string) => encodeURIComponent(s);
    const base = (bg: string, fg: string, label: string) =>
      `data:image/svg+xml;utf8,` +
      safe(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>` +
          `<defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='${bg}'/><stop offset='1' stop-color='${fg}'/></linearGradient></defs>` +
          `<rect width='100%' height='100%' fill='url(#g)'/>` +
          `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter,Arial' font-size='72' fill='white' opacity='0.9'>${label}</text>` +
        `</svg>`
      );
    switch (tag) {
      case 'Math': return base('#2563eb', '#1e3a8a', 'Math');
      case 'Science': return base('#059669', '#064e3b', 'Science');
      case 'Programming': return base('#7c3aed', '#4c1d95', 'Code');
      case 'Design': return base('#f59e0b', '#b45309', 'Design');
      default: return base('#64748b', '#334155', 'Course');
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'educator') {
      navigate('/auth');
      return;
    }
    loadCourses();
  }, [user, isLoading, navigate]);

  const handleDeleteAccount = async () => {
    const ok = window.confirm('This will permanently delete your account and your courses. Continue?');
    if (!ok) return;
    try {
      await apiFetch('/auth/me', { method: 'DELETE' });
    } catch {}
    logout();
  };

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

    // Derive thumbnail from selected tag (first tag or Others)
    const primaryTag = (formData.tags || '').split(',').map(t => t.trim()).filter(Boolean)[0] || 'Others';
    const thumbnailUrl = getTagThumbnail(primaryTag);

    // Use the editable list as the single source of truth
    const materials = linkMaterials.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      url: m.url,
      size: m.size ?? 0,
    }));

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
    setLinkMaterials([]);
    setNewYouTubeUrl('');
    setNewYouTubeTitle('');
    setNewDriveUrl('');
    setNewDriveTitle('');
  };

  // no manual thumbnail upload anymore

  const extractYouTubeId = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
      if (u.hostname.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return v;
        const parts = u.pathname.split('/');
        const idx = parts.indexOf('embed');
        if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      }
    } catch {}
    return '';
  };

  const extractDriveId = (url: string) => {
    try {
      const u = new URL(url);
      // Format: https://drive.google.com/file/d/FILE_ID/view
      const parts = u.pathname.split('/');
      const idx = parts.indexOf('d');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      // Shared links: https://drive.google.com/open?id=FILE_ID or ?id=
      const idParam = u.searchParams.get('id');
      if (idParam) return idParam;
    } catch {}
    return '';
  };

  const addYouTubeMaterial = () => {
    const vid = extractYouTubeId(newYouTubeUrl.trim());
    if (!vid) {
      toast({ title: 'Invalid YouTube URL', variant: 'destructive' });
      return;
    }
    const watchUrl = `https://www.youtube.com/watch?v=${vid}`;
    setLinkMaterials((prev) => [
      ...prev,
      { id: `yt-${vid}-${Date.now()}`, type: 'youtube', url: watchUrl, name: newYouTubeTitle || 'YouTube Video' },
    ]);
    setNewYouTubeUrl('');
    setNewYouTubeTitle('');
  };

  const addDriveMaterial = () => {
    const fid = extractDriveId(newDriveUrl.trim());
    if (!fid) {
      toast({ title: 'Invalid Google Drive link', variant: 'destructive' });
      return;
    }
    const openUrl = `https://drive.google.com/uc?export=view&id=${fid}`;
    setLinkMaterials((prev) => [
      ...prev,
      { id: `gd-${fid}-${Date.now()}`, type: 'drive', url: openUrl, name: newDriveTitle || 'Drive Resource' },
    ]);
    setNewDriveUrl('');
    setNewDriveTitle('');
  };

  const removeLinkMaterial = (id: string) => {
    setLinkMaterials((prev) => prev.filter((m) => m.id !== id));
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
    setLinkMaterials([]);
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        )}
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
                      <Label>Category</Label>
                      <Select
                        value={(formData.tags.split(',')[0] || 'Others')}
                        onValueChange={(val) => setFormData({ ...formData, tags: val === 'Others' ? '' : val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {TAGS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Thumbnail is auto-derived from selected tag */}
                  <div className="space-y-3">
                    <Label>Study Materials</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2 p-3 border rounded-lg">
                        <p className="text-sm font-medium">Add YouTube Video</p>
                        <Input
                          placeholder="YouTube URL"
                          value={newYouTubeUrl}
                          onChange={(e) => setNewYouTubeUrl(e.target.value)}
                        />
                        <Input
                          placeholder="Title (optional)"
                          value={newYouTubeTitle}
                          onChange={(e) => setNewYouTubeTitle(e.target.value)}
                        />
                        <Button type="button" variant="outline" onClick={addYouTubeMaterial}>Add Video</Button>
                      </div>
                      <div className="space-y-2 p-3 border rounded-lg">
                        <p className="text-sm font-medium">Add Google Drive Link</p>
                        <Input
                          placeholder="Google Drive link"
                          value={newDriveUrl}
                          onChange={(e) => setNewDriveUrl(e.target.value)}
                        />
                        <Input
                          placeholder="Title (optional)"
                          value={newDriveTitle}
                          onChange={(e) => setNewDriveTitle(e.target.value)}
                        />
                        <Button type="button" variant="outline" onClick={addDriveMaterial}>Add Resource</Button>
                      </div>
                    </div>
                    {linkMaterials.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {linkMaterials.map((m) => (
                          <div key={m.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="truncate">
                              <p className="text-sm font-medium">{m.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{m.type.toUpperCase()} • {m.url}</p>
                            </div>
                            <Button type="button" variant="ghost" onClick={() => removeLinkMaterial(m.id)}>Remove</Button>
                          </div>
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
                  <div className="aspect-video rounded-lg mb-4 overflow-hidden bg-muted">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt="Course thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary" />
                      </div>
                    )}
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