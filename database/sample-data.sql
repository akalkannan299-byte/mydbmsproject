USE noirbite_db;
INSERT IGNORE INTO food_categories (id, name, description) VALUES
(1,'Breakfast','South Indian breakfast favourites'),
(2,'Lunch','Comforting lunch plates and rice'),
(3,'Snacks','Quick bites and crispy snacks'),
(4,'Juices & Beverages','Fresh drinks and hot beverages'),
(5,'Dinner','Delicious evening meals');

-- Explicit ids + INSERT IGNORE make this script safe to run more than once (no duplicate dishes).
INSERT IGNORE INTO food_items (id, name, description, image_url, category_id, price, vegetarian, available, daily_special) VALUES
(1,'Idli','Soft steamed rice cakes served with chutney','https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=700&q=80',1,30.00,TRUE,TRUE,FALSE),
(2,'Plain Dosa','Crispy golden dosa with chutney','https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=700&q=80',1,60.00,TRUE,TRUE,TRUE),
(3,'Masala Dosa','Crisp dosa with spiced potato filling','https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=700&q=80',1,85.00,TRUE,TRUE,FALSE),
(4,'Pongal','Creamy rice and lentil pongal','https://images.unsplash.com/photo-1626500155537-93690c24099e?auto=format&fit=crop&w=700&q=80',1,55.00,TRUE,TRUE,FALSE),
(5,'South Indian Meals','A balanced traditional meal','https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=80',2,160.00,TRUE,TRUE,TRUE),
(6,'Chicken Biryani','Aromatic basmati rice and chicken','https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=700&q=80',2,190.00,FALSE,TRUE,FALSE),
(7,'Veg Biryani','Fragrant rice with vegetables and spices','https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=700&q=80',2,140.00,TRUE,TRUE,FALSE),
(8,'Samosa','Crispy pastry with savoury filling','https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80',3,25.00,TRUE,TRUE,FALSE),
(9,'French Fries','Golden crispy potato fries','https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80',3,90.00,TRUE,TRUE,FALSE),
(10,'Mango Juice','Chilled mango juice','https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=700&q=80',4,70.00,TRUE,TRUE,FALSE),
(11,'Fresh Lime Juice','Fresh lime with a refreshing finish','https://images.unsplash.com/photo-1513558161293-cdaf765edfd7?auto=format&fit=crop&w=700&q=80',4,50.00,TRUE,TRUE,FALSE),
(12,'Tea','Freshly brewed Indian tea','https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=700&q=80',4,20.00,TRUE,TRUE,FALSE),
(13,'Parotta','Layered flaky flatbread','https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=700&q=80',5,25.00,TRUE,TRUE,FALSE),
(14,'Paneer Butter Masala','Paneer in a rich tomato gravy','https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=80',5,170.00,TRUE,TRUE,TRUE),
(15,'Veg Fried Rice','Wok-tossed rice with vegetables','https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80',5,130.00,TRUE,TRUE,FALSE);
