// Supabase配置
const SUPABASE_URL = 'https://lvoilfcloljoyldoixvs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2b2lsZmNsb2xqb3lsZG9peHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjUxMjEsImV4cCI6MjA3ODkwMTEyMX0.2bb5vQ2F84iz4qYizr64TartFD4iBpFQqO-kZTsemZA';

// 初始化Supabase客户端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 全局变量
let currentBookId = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 页面加载完成，开始初始化...');
    
    // 根据当前页面执行不同的初始化函数
    const path = window.location.pathname;
    const page = path.split('/').pop();
    const fullUrl = window.location.href;
    
    console.log('🔍 检测页面:', {
        path: path,
        page: page,
        fullUrl: fullUrl
    });
    
    // 改进的页面检测逻辑
    if (page === 'index.html' || page === '' || page === '/' || fullUrl.includes('index.html')) {
        console.log('🏠 初始化首页');
        initHomePage();
    } else if (page === 'book-detail.html' || fullUrl.includes('book-detail')) {
        console.log('📖 初始化图书详情页');
        initBookDetailPage();
    } else if (page === 'add-book.html' || fullUrl.includes('add-book')) {
        console.log('➕ 初始化添加图书页');
        initAddBookPage();
    } else {
        console.log('❓ 未知页面:', page);
        // 默认尝试初始化首页
        initHomePage();
    }
});

// 首页初始化
async function initHomePage() {
    console.log('初始化首页...');
    await loadCategories();
    await loadBooks();
}

// 图书详情页初始化
async function initBookDetailPage() {
    console.log('初始化图书详情页...');
    // 从URL获取图书ID
    const urlParams = new URLSearchParams(window.location.search);
    currentBookId = urlParams.get('id');
    
    if (currentBookId) {
        await loadBookDetail(currentBookId);
        await loadReviews(currentBookId);
        setupReviewForm();
    } else {
        const bookDetailContainer = document.getElementById('book-detail');
        if (bookDetailContainer) {
            bookDetailContainer.innerHTML = '<p>未找到指定的图书</p>';
        }
    }
}

// 添加图书页初始化
async function initAddBookPage() {
    console.log('初始化添加图书页...');
    await loadCategoriesForForm();
    setupBookForm();
}

// 加载分类（首页用）
async function loadCategories() {
    try {
        console.log('开始加载分类...');
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*');
        
        if (error) {
            console.error('Supabase错误:', error);
            throw error;
        }
        
        console.log('加载到的分类:', categories);
        
        const categoriesContainer = document.getElementById('categories-list');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = '';
            
            if (categories && categories.length > 0) {
                categories.forEach(category => {
                    const categoryCard = document.createElement('div');
                    categoryCard.className = 'category-card';
                    categoryCard.innerHTML = `
                        <h3>${category.name}</h3>
                        <p>${category.description || '暂无描述'}</p>
                    `;
                    categoriesContainer.appendChild(categoryCard);
                });
            } else {
                categoriesContainer.innerHTML = '<p>暂无分类数据</p>';
            }
        }
    } catch (error) {
        console.error('加载分类时出错:', error);
        const categoriesContainer = document.getElementById('categories-list');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = '<p>加载分类时出错，请检查控制台</p>';
        }
    }
}

// 加载图书
async function loadBooks() {
    try {
        console.log('开始加载图书...');
        const { data: books, error } = await supabase
            .from('books')
            .select('*');
        
        if (error) {
            console.error('Supabase错误:', error);
            throw error;
        }
        
        console.log('加载到的图书:', books);
        
        const booksContainer = document.getElementById('books-list');
        if (booksContainer) {
            booksContainer.innerHTML = '';
            
            if (books && books.length > 0) {
                books.forEach(book => {
                    const bookCard = document.createElement('div');
                    bookCard.className = 'book-card';
                    bookCard.innerHTML = `
                        <img src="${book.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'}" alt="${book.title}">
                        <div class="book-info">
                            <h3>${book.title}</h3>
                            <p class="author">${book.author}</p>
                            <p class="description">${book.description || '暂无描述'}</p>
                            <a href="book-detail.html?id=${book.id}" class="view-details">查看详情</a>
                        </div>
                    `;
                    booksContainer.appendChild(bookCard);
                });
            } else {
                booksContainer.innerHTML = '<p>暂无图书，请添加第一本图书！</p>';
            }
        }
    } catch (error) {
        console.error('加载图书时出错:', error);
        const booksContainer = document.getElementById('books-list');
        if (booksContainer) {
            booksContainer.innerHTML = '<p>加载图书时出错，请检查控制台</p>';
        }
    }
}

// 为表单加载分类（添加图书页用）
async function loadCategoriesForForm() {
    try {
        console.log('开始为表单加载分类...');
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*');
        
        if (error) {
            console.error('Supabase错误:', error);
            throw error;
        }
        
        console.log('表单加载到的分类:', categories);
        
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">请选择分类</option>';
            
            if (categories && categories.length > 0) {
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
                
                console.log('分类下拉框已填充');
            } else {
                // 备用分类选项
                categorySelect.innerHTML = `
                    <option value="">请选择分类</option>
                    <option value="1">小说</option>
                    <option value="2">科技</option>
                    <option value="3">历史</option>
                    <option value="4">自助</option>
                `;
                console.log('使用备用分类选项');
            }
        }
    } catch (error) {
        console.error('加载分类时出错:', error);
        // 添加备用分类选项
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.innerHTML = `
                <option value="">请选择分类</option>
                <option value="1">小说</option>
                <option value="2">科技</option>
                <option value="3">历史</option>
                <option value="4">自助</option>
            `;
            console.log('使用备用分类选项（错误时）');
        }
    }
}

// 加载图书详情
async function loadBookDetail(bookId) {
    try {
        console.log('开始加载图书详情，ID:', bookId);
        const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();
        
        if (error) {
            console.error('Supabase错误:', error);
            throw error;
        }
        
        console.log('加载到的图书详情:', book);
        
        const bookDetailContainer = document.getElementById('book-detail');
        if (bookDetailContainer) {
            // 获取分类名称
            let categoryName = '未知分类';
            if (book.category_id) {
                const { data: category } = await supabase
                    .from('categories')
                    .select('name')
                    .eq('id', book.category_id)
                    .single();
                if (category) {
                    categoryName = category.name;
                }
            }
            
            bookDetailContainer.innerHTML = `
                <div class="book-detail-header">
                    <div class="book-cover">
                        <img src="${book.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'}" alt="${book.title}">
                    </div>
                    <div class="book-meta">
                        <h2>${book.title}</h2>
                        <p class="author">作者: ${book.author}</p>
                        <p class="description">${book.description || '暂无描述'}</p>
                        <span class="category">${categoryName}</span>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载图书详情时出错:', error);
        const bookDetailContainer = document.getElementById('book-detail');
        if (bookDetailContainer) {
            bookDetailContainer.innerHTML = '<p>加载图书详情时出错</p>';
        }
    }
}

// 加载评论
async function loadReviews(bookId) {
    try {
        console.log('开始加载评论，图书ID:', bookId);
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('book_id', bookId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase错误:', error);
            throw error;
        }
        
        console.log('加载到的评论:', reviews);
        
        const reviewsContainer = document.getElementById('reviews-list');
        if (reviewsContainer) {
            reviewsContainer.innerHTML = '';
            
            if (reviews && reviews.length > 0) {
                reviews.forEach(review => {
                    const reviewItem = document.createElement('div');
                    reviewItem.className = 'review-item';
                    
                    const date = new Date(review.created_at).toLocaleDateString('zh-CN');
                    
                    reviewItem.innerHTML = `
                        <div class="review-header">
                            <div class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                            <div class="review-date">${date}</div>
                        </div>
                        <div class="review-comment">${review.comment}</div>
                    `;
                    
                    reviewsContainer.appendChild(reviewItem);
                });
            } else {
                reviewsContainer.innerHTML = '<p>暂无评论</p>';
            }
        }
    } catch (error) {
        console.error('加载评论时出错:', error);
        const reviewsContainer = document.getElementById('reviews-list');
        if (reviewsContainer) {
            reviewsContainer.innerHTML = '<p>加载评论时出错</p>';
        }
    }
}

// 设置评论表单
function setupReviewForm() {
    const form = document.getElementById('review-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const rating = document.getElementById('rating').value;
            const comment = document.getElementById('comment').value;
            
            if (!rating || !comment) {
                alert('请填写所有必填字段');
                return;
            }
            
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .insert([
                        {
                            book_id: currentBookId,
                            rating: parseInt(rating),
                            comment: comment
                        }
                    ]);
                
                if (error) throw error;
                
                alert('评论添加成功!');
                form.reset();
                await loadReviews(currentBookId); // 重新加载评论
            } catch (error) {
                console.error('添加评论时出错:', error);
                alert('添加评论时出错，请重试');
            }
        });
    }
}

// 设置图书表单
function setupBookForm() {
    const form = document.getElementById('book-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('title').value;
            const author = document.getElementById('author').value;
            const description = document.getElementById('description').value;
            const coverUrl = document.getElementById('cover-url').value;
            const categoryId = document.getElementById('category').value;
            
            if (!title || !author || !categoryId) {
                alert('请填写所有必填字段');
                return;
            }
            
            try {
                const { data, error } = await supabase
                    .from('books')
                    .insert([
                        {
                            title: title,
                            author: author,
                            description: description,
                            cover_url: coverUrl,
                            category_id: parseInt(categoryId)
                        }
                    ]);
                
                if (error) throw error;
                
                alert('图书添加成功!');
                form.reset();
            } catch (error) {
                console.error('添加图书时出错:', error);
                alert('添加图书时出错，请重试');
            }
        });
    }
}

// 测试Supabase连接
// 测试Supabase连接
async function testSupabaseConnection() {
    try {
        console.log('测试Supabase连接...');
        const { data, error } = await supabase
            .from('categories')
            .select('*');
        
        if (error) throw error;
        console.log('Supabase连接成功! 数据:', data);
        return true;
    } catch (error) {
        console.error('Supabase连接失败:', error);
        return false;
    }
}

// 页面加载时测试连接
testSupabaseConnection();


