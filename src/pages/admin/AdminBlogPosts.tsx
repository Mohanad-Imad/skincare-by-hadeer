import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminBlogPosts = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author_name: "فريق التحرير",
    status: "draft",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("يجب تسجيل الدخول");

      let imageUrl = editingPost?.image_url || "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const postData = {
        ...formData,
        image_url: imageUrl,
        created_by: user.id,
        published_at: formData.status === "published" ? new Date().toISOString() : null,
      };

      if (editingPost) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(postData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success(editingPost ? "تم تحديث المقال" : "تم إضافة المقال");
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("تم حذف المقال");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      author_name: "فريق التحرير",
      status: "draft",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
    });
    setEditingPost(null);
    setImageFile(null);
    setImagePreview("");
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author_name: post.author_name,
      status: post.status,
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      meta_keywords: post.meta_keywords || "",
    });
    setImagePreview(post.image_url || "");
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">إدارة المقالات</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-4 w-4" />
              مقال جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? "تعديل المقال" : "مقال جديد"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">العنوان *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">الرابط (Slug) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">الملخص *</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">المحتوى *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  required
                />
              </div>

              <div>
                <Label htmlFor="image">صورة المقال</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-auto rounded" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="author">اسم الكاتب</Label>
                  <Input
                    id="author"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">الحالة</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="published">منشور</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">SEO</h3>
                <div>
                  <Label htmlFor="meta_title">عنوان SEO</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="سيتم استخدام العنوان الرئيسي إذا ترك فارغاً"
                  />
                </div>
                <div>
                  <Label htmlFor="meta_description">وصف SEO</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="meta_keywords">الكلمات المفتاحية</Label>
                  <Input
                    id="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                    placeholder="افصل بينها بفاصلة"
                  />
                </div>
              </div>

              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>جاري التحميل...</div>
      ) : (
        <div className="grid gap-4">
          {posts?.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{post.title}</CardTitle>
                      <Badge variant={post.status === "published" ? "default" : "secondary"}>
                        {post.status === "published" ? "منشور" : "مسودة"}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">{post.excerpt}</CardDescription>
                  </div>
                  {post.image_url && (
                    <img src={post.image_url} alt={post.title} className="h-20 w-20 rounded object-cover mr-4" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span>بواسطة: {post.author_name}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(post.created_at).toLocaleDateString("ar-IQ")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(post)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBlogPosts;
