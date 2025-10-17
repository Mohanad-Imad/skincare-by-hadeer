-- حذف جميع المستخدمين من نظام المصادقة
-- هذا ضروري لأن TRUNCATE السابق حذف profiles و user_roles لكن ليس auth.users
DELETE FROM auth.users;