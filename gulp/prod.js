// Основний модуль Gulp для автоматизації задач
const gulp = require('gulp');
// Модуль для роботи з шляхами файлів
const path = require('path');
// Модуль для заміни тексту в файлах
const replace = require('gulp-replace');

// HTML обробка
const fileInclude = require('gulp-file-include'); // Вставка вмісту одного файлу в інший
const htmlclean = require('gulp-htmlclean'); // Мінімізація HTML файлів
const webpHTML = require('gulp-webp-retina-html'); // Додавання тегів <picture> для WebP зображень
const typograf = require('gulp-typograf'); // Виправлення типографічних помилок в тексті

// Обробка SASS (CSS)
const sass = require('gulp-sass')(require('sass')); // Компіляція SASS в CSS
const sassGlob = require('gulp-sass-glob'); // Дозволяє імпортувати всі SASS файли за допомогою одного шаблону
const autoprefixer = require('gulp-autoprefixer'); // Додавання автопрефіксів для CSS
const csso = require('gulp-csso'); // Мінімізація CSS файлів

// Локальний сервер для розробки з livereload
const server = require('gulp-server-livereload');
// Модуль для видалення файлів або папок
const clean = require('gulp-clean');
// Вбудований модуль Node.js для роботи з файловою системою
const fs = require('fs');
// Генерація source maps для CSS
const sourceMaps = require('gulp-sourcemaps');
// Групування CSS медіа-запитів
const groupMedia = require('gulp-group-css-media-queries');
// Обробник помилок, щоб завдання не переривалися при їх виникненні
const plumber = require('gulp-plumber');
// Виведення повідомлень про помилки
const notify = require('gulp-notify');
// Інтеграція Webpack для обробки JavaScript модулів
const webpack = require('webpack-stream');
// Транспіляція JavaScript коду новіших версій у зворотно сумісний
const babel = require('gulp-babel');
// Перевірка на зміни в файлах для оптимізації процесу зборки
const changed = require('gulp-changed');

// Обробка зображень
const imagemin = require('gulp-imagemin'); // Мінімізація та оптимізація зображень

// Обробка SVG файлів
const svgsprite = require('gulp-svg-sprite'); // Створення SVG спрайтів
const cwebp = require('gulp-cwebp'); // Конвертація зображень в формат WebP

// Визначення шляхів до джерел та місць збереження результатів
const srcPath = path.join(__dirname, '..', 'src', 'img'); // Шлях до джерельних зображень
const destPath = path.join(__dirname, '..', 'prod', 'img'); // Шлях для збереження оброблених зображень

// Функція для створення директорії, якщо вона не існує.
// Це забезпечує, що не виникне помилки при спробі збереження файлів в неіснуючу директорію.
function ensureDirSync(dirPath) {
	// Перевіряємо, чи існує директорія
	if (!fs.existsSync(dirPath)) {
		// Якщо директорії не існує, створюємо її з усіма необхідними батьківськими директоріями
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

// Завдання для видалення всього вмісту директорії продакшн перед новою збіркою
gulp.task('clean:prod', function (done) {
	// Перевіряємо, чи існує директорія продакшн
	if (fs.existsSync('./prod/')) {
		return gulp
			.src('./prod/', { read: false }) // Вказуємо шлях до директорії, вміст якої потрібно видалити
			.pipe(clean({ force: true })); // Видаляємо директорію з усіма файлами, використовуючи опцію force
	}
	done(); // Закінчуємо виконання завдання
});

// Конфігурація для gulp-file-include, що дозволяє включати вміст одних файлів в інші
const fileIncludeSetting = {
	prefix: '@@', // Визначаємо префікс, який використовується для ідентифікації включень
	basepath: '@file', // Встановлюємо базовий шлях до включених файлів
};

// Функція для налаштування обробки помилок з використанням gulp-plumber та gulp-notify
const plumberNotify = (title) => {
	return {
		errorHandler: notify.onError({
			title: title, // Назва завдання, де виникла помилка
			message: 'Error <%= error.message %>', // Повідомлення, що виводиться при помилці
			sound: false, // Вимкнення звукового сигналу при помилці
		}),
	};
};



// Завдання для обробки HTML файлів перед розгортанням у продакшн
gulp.task('html:prod', function () {
	return gulp
		.src(['./src/html/**/*.html', '!./src/html/blocks/*.html']) // Вибір всіх HTML файлів, крім блоків
		.pipe(changed('./prod/')) // Перевірка на зміни, щоб оптимізувати процес
		.pipe(plumber(plumberNotify('HTML'))) // Обробка помилок без переривання потоку
		.pipe(fileInclude(fileIncludeSetting)) // Вставка вмісту файлів (наприклад, шаблонів)
		.pipe(replace(/(<picture[\s\S]*?<\/picture>)/gi, function(match) {
            return match.replace(/(\.\.\/img\/[^"'\s]+)(\.(png|jpg|jpeg|gif))/g, '$1.webp');
        }))
		.pipe(
			replace(
				// Заміна відносних шляхів для засобів мультимедіа, щоб вони коректно працювали у продакшні
				/(?<=src=|href=|srcset=)(['"])(\.(\.)?\/)*(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi,
				'$1./$4$5$7$1'
			)
		)
		.pipe(
			typograf({
				// Покращення типографіки для підтримки локалізацій
				locale: ['uk', 'en-US'],
				htmlEntity: { type: 'digit' },
				safeTags: [
					// Збереження спеціальних тегів, наприклад, для PHP коду
					['<\\?php', '\\?>'],
					['<no-typography>', '</no-typography>'],
				],
			})
		)
		.pipe(
			webpHTML({
				// Автоматичне додавання тегів <picture> для підтримки зображень у форматі WebP
				extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
				retina: {
					// Підтримка ретини
					1: '',
					2: '@2x',
				},
			})
		)
		.pipe(htmlclean()) // Мінімізація HTML файлів
		.pipe(gulp.dest('./prod/')); // Зберігання оброблених HTML файлів у папці продакшн
});

// Завдання для компіляції SASS файлів у CSS для продакшну
gulp.task('sass:prod', function () {
	return gulp
		.src('./src/scss/*.scss') // Вибір SASS файлів для компіляції
		.pipe(changed('./prod/css/')) // Перевірка на зміни для оптимізації процесу
		.pipe(plumber(plumberNotify('SCSS'))) // Обробка помилок без переривання потоку
		.pipe(sourceMaps.init()) // Ініціація source maps для легшої відладки
		.pipe(autoprefixer()) // Додавання вендорних префіксів для підтримки старих браузерів
		.pipe(sassGlob()) // Дозволяє використовувати шаблони для імпорту SASS файлів
		.pipe(groupMedia()) // Групування медіа-запитів для оптимізації
		.pipe(sass()) // Компіляція SASS у CSS
		.pipe(
			replace(
				// Заміна шляхів до засобів мультимедіа в CSS
				/(['"]?)(\.\.\/)+(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi,
				'$1$2$3$4$6$1'
			)
		)
		.pipe(csso()) // Мінімізація CSS файлів
		.pipe(sourceMaps.write()) // Запис source maps
		.pipe(gulp.dest('./prod/css/')); // Зберігання оброблених CSS файлів у папці продакшн
});

// Завдання для обробки зображень для продуктивного середовища
gulp.task('images:prod', function () {
	// Переконуємося, що директорія для зберігання зображень існує
	ensureDirSync(destPath);

	// Обробка PNG, JPG, JPEG зображень: конвертація в формат WebP
	return gulp.src([`${srcPath}/**/*.{png,jpg,jpeg}`, `!${srcPath}/svgicons/**/*`])
		.pipe(cwebp()) // Конвертація в формат WebP
		.pipe(gulp.dest(destPath)) // Збереження оброблених зображень
		.on('error', notify.onError({ message: 'Error: <%= error.message %>', title: 'Image Processing Error Step 1' })) // Обробка помилок для першого кроку
		.pipe(gulp.src([`${srcPath}/**/*`, `!${srcPath}/**/*.{png,jpg,jpeg}`, `!${srcPath}/svgicons/**/*`])) // Обробка інших форматів зображень, виключаючи SVG іконки
		.pipe(imagemin([ // Оптимізація зображень за допомогою плагінів
			imagemin.gifsicle({ interlaced: true }),
			imagemin.mozjpeg({ quality: 75, progressive: true }),
			imagemin.optipng({ optimizationLevel: 5 })
		], { verbose: true })) // Виведення інформації про обробку
		.pipe(gulp.dest(destPath)) // Збереження оптимізованих зображень
		.on('error', notify.onError({ message: 'Error: <%= error.message %>', title: 'Image Processing Error Step 2' })); // Обробка помилок для другого кроку
});

// Конфігурація для генерації SVG спрайту у форматі stack
const svgStack = {
	mode: {
		stack: {
			example: true, // Генерація прикладу використання спрайту
		},
	},
};

// Конфігурація для генерації SVG спрайту у форматі symbol
const svgSymbol = {
	mode: {
		symbol: {
			sprite: '../sprite.symbol.svg', // Вказуємо шлях і назву для генерованого спрайту
		},
	},
	shape: {
		transform: [
			{
				svgo: {
					plugins: [
						{
							name: 'removeAttrs', // Видалення атрибутів fill і stroke для оптимізації
							params: {
								attrs: '(fill|stroke)',
							},
						},
					],
				},
			},
		],
	},
};
// Коментарі пояснюють мету кожного завдання та конфігурації, допомагаючи розумінню та подальшій розробці.

// Завдання для генерації SVG спрайту у форматі stack для продуктивного середовища
gulp.task('svgStack:prod', function () {
	return gulp
		.src('./src/img/svgicons/**/*.svg') // Вибір всіх SVG файлів з папки svgicons
		.pipe(plumber(plumberNotify('SVG:dev'))) // Обробка помилок з виведенням нотифікацій
		.pipe(svgsprite(svgStack)) // Створення SVG спрайту з використанням переданої конфігурації
		.pipe(gulp.dest('./prod/img/svgsprite/')); // Зберігання результату в спеціалізовану папку
});

// Завдання для генерації SVG спрайту у форматі symbol для продуктивного середовища
gulp.task('svgSymbol:prod', function () {
	return gulp
		.src('./src/img/svgicons/**/*.svg') // Вибір всіх SVG файлів з папки svgicons
		.pipe(plumber(plumberNotify('SVG:dev'))) // Обробка помилок з виведенням нотифікацій
		.pipe(svgsprite(svgSymbol)) // Створення SVG спрайту (символи) з використанням переданої конфігурації
		.pipe(gulp.dest('./prod/img/svgsprite/')); // Зберігання результату в спеціалізовану папку
});

// Завдання для копіювання всіх статичних файлів у продуктивне середовище
gulp.task('files:prod', function () {
	return gulp
		.src('./src/files/**/*') // Вибір всіх файлів з папки files
		.pipe(changed('./prod/files/')) // Перевірка на зміни для оптимізації процесу копіювання
		.pipe(gulp.dest('./prod/files/')); // Зберігання файлів у продуктивній директорії
});

// Завдання для обробки та збірки JavaScript файлів для продуктивного середовища
gulp.task('js:prod', function () {
	return gulp
		.src('./src/js/*.js') // Вибір всіх JavaScript файлів для обробки
		.pipe(changed('./prod/js/')) // Перевірка на зміни для оптимізації процесу збірки
		.pipe(plumber(plumberNotify('JS'))) // Обробка помилок з виведенням нотифікацій
		.pipe(babel()) // Транспіляція JavaScript коду для забезпечення сумісності
		.pipe(webpack(require('../webpack.config.js'))) // Збірка модулів JavaScript з використанням Webpack
		.pipe(gulp.dest('./prod/js/')); // Зберігання оброблених файлів у продуктивній директорії
});

// Налаштування сервера для продуктивного середовища без livereload та автоматичного відкриття
const serverOptions = {
	livereload: false, // Вимкнення livereload
	open: true, // Вимкнення автоматичного відкриття у браузері
};

// Завдання для запуску локального сервера для перегляду продуктивного середовища
gulp.task('server:prod', function () {
	return gulp.src('./prod/') // Вказуємо кореневу папку продуктивного середовища
		.pipe(server(serverOptions)); // Запускаємо сервер з заданими налаштуваннями
});

// Асинхронне завдання для створення .zip архіву з папки prod
gulp.task('zip:prod', async function () {
	// Динамічний імпорт gulp-zip
	const zip = (await import('gulp-zip')).default;

	return gulp.src('./prod/**/*')
		.pipe(zip('prod.zip'))
		.pipe(gulp.dest('./'));
});