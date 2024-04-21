// Підключення необхідних модулів

// Підключення Gulp для автоматизації завдань
const gulp = require('gulp');

// Плагін для включення вмісту одних файлів в інші (наприклад, HTML фрагментів)
const fileInclude = require('gulp-file-include');

// Компілятор SASS в CSS
const sass = require('gulp-sass')(require('sass'));

// Плагін, який дозволяє імпортувати SASS файлів за допомогою шаблонів (globbing)
const sassGlob = require('gulp-sass-glob');

// Локальний сервер з можливістю livereload (автоматичного перезавантаження браузера)
const server = require('gulp-server-livereload');

// Плагін для видалення файлів або директорій
const clean = require('gulp-clean');

// Модуль для роботи з файловою системою
const fs = require('fs');

// Плагін для генерації source maps, які допомагають відслідковувати CSS до SASS файлів при відладці
const sourceMaps = require('gulp-sourcemaps');

// Плагін для обробки помилок без переривання потоку завдань
const plumber = require('gulp-plumber');

// Плагін для відображення повідомлень про помилки у вигляді сповіщень у системі
const notify = require('gulp-notify');

// Плагін для інтеграції Webpack, інструменту для збірки JavaScript модулів
const webpack = require('webpack-stream');

// Плагін для транспіляції JavaScript ES6 та вище в зворотньо сумісний код
const babel = require('gulp-babel');

// Плагін для оптимізації зображень
const imagemin = require('gulp-imagemin');

// Плагін для перевірки, чи були змінені файли перед їх обробкою, щоб мінімізувати час обробки
const changed = require('gulp-changed');

// Плагін для обробки тексту, виправлення типографічних помилок
const typograf = require('gulp-typograf');

// Плагін для створення SVG спрайтів
const svgsprite = require('gulp-svg-sprite');

// Плагін для заміни тексту в файлах на основі заданих шаблонів
const replace = require('gulp-replace');


// Завдання для очищення папки build перед збіркою
gulp.task('clean:dev', function (done) {
	// Перевірка наявності папки build і її видалення
	if (fs.existsSync('./build/')) {
		return gulp.src('./build/', { read: false })
			.pipe(clean({ force: true }));
	}
	done();
});

// Налаштування для gulp-file-include
const fileIncludeSetting = {
	prefix: '@@', // Префікс для вказівки місця включення файлу
	basepath: '@file', // Базовий шлях до включених файлів
};

// Налаштування обробника помилок
const plumberNotify = (title) => {
	return plumber(notify.onError({
		title: title, // Назва завдання, де виникла помилка
		message: 'Error <%= error.message %>',
		sound: false, // Вимкнення звукового сигналу помилки
	}));
};

// Завдання для обробки HTML файлів
gulp.task('html:dev', function () {
	return gulp.src(['./src/html/**/*.html', '!./src/html/blocks/*.html']) // Вибірка HTML файлів, крім блоків
		.pipe(changed('./build/', { hasChanged: changed.compareContents })) // Перевірка на зміни вмісту файлів
		.pipe(plumberNotify('HTML')) // Використання обробника помилок
		.pipe(fileInclude(fileIncludeSetting)) // Включення вмісту файлів
		.pipe(// Заміна шляхів до ресурсів
			replace(
				/(?<=src=|href=|srcset=)(['"])(\.(\.)?\/)*(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi,
				'$1./$4$5$7$1'
			)
		)
		.pipe(// Використання typograf для обробки тексту
			typograf({
				locale: ['uk', 'en-US'],
				htmlEntity: { type: 'digit' },
				safeTags: [
					['<\\?php', '\\?>'],
					['<no-typography>', '</no-typography>'],
				],
			})
		)
		.pipe(gulp.dest('./build/'));// Збереження оброблених файлів
});

// Завдання для компіляції SASS файлів у CSS
gulp.task('sass:dev', function () {
	return gulp
		.src('./src/scss/*.scss') // Вказуємо шлях до SASS файлів, які потрібно скомпілювати
		.pipe(changed('./build/css/')) // Перевіряємо, чи були зміни в CSS від останньої компіляції, щоб зменшити час обробки
		.pipe(plumber(plumberNotify('SCSS'))) // Використовуємо plumber для обробки помилок без переривання потоку Gulp
		.pipe(sourceMaps.init()) // Ініціалізація source maps для зручності розробки
		.pipe(sassGlob()) // Дозволяє імпортувати всі SASS файлы однією командою
		.pipe(sass()) // Компіляція SASS файлів у CSS
		.pipe(
			replace(
				/(['"]?)(\.\.\/)+(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi,
				'$1$2$3$4$6$1' // Заміна шляхів у CSS файлах для коректного відображення ресурсів
			)
		)
		.pipe(sourceMaps.write()) // Запис source maps
		.pipe(gulp.dest('./build/css/')); // Зберігання результату в папку build/css
});

// Завдання для копіювання зображень з src в build, виключаючи SVG іконки (для спеціальної обробки)
gulp.task('images:dev', function () {
	return gulp
		.src(['./src/img/**/*', '!./src/img/svgicons/**/*']) // Вибір всіх зображень, крім svgicons
		.pipe(changed('./build/img/')) // Перевірка на зміни для оптимізації процесу
		// .pipe(imagemin({ verbose: true })) // Можлива оптимізація зображень
		.pipe(gulp.dest('./build/img/')); // Копіювання зображень у папку build/img
});

// Конфігурація для створення SVG спрайтів у форматі stack
const svgStack = {
	mode: {
		stack: {
			example: true, // Генерація прикладу використання спрайту
		},
	},
	shape: {
		transform: [
			{
				svgo: {
					js2svg: { indent: 4, pretty: true }, // Форматування SVG для кращої читабельності
				},
			},
		],
	},
};

// Ця конфігурація дозволяє зручно генерувати SVG спрайти,
// оптимізовуючи зображення за допомогою SVGO під час процесу.
// Вона корисна для впорядкування іконок та зменшення кількості HTTP запитів до сервера.


// Конфігурація для генерації SVG символів, яка використовується з gulp-svg-sprite
const svgSymbol = {
	mode: {
		symbol: {
			// Шлях та ім'я файлу для генерованого SVG спрайту
			sprite: '../sprite.symbol.svg',
		},
	},
	shape: {
		transform: [
			{
				// Конфігурація SVGO для оптимізації SVG файлів
				svgo: {
					js2svg: { indent: 4, pretty: true }, // Відступи для кращої читабельності SVG
					plugins: [
						{
							name: 'removeAttrs', // Видалення атрибутів fill та stroke
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

// Завдання для генерації SVG стеку (спрайтів)
gulp.task('svgStack:dev', function () {
	return gulp
		.src('./src/img/svgicons/**/*.svg') // Вибір усіх SVG файлів у вказаній директорії
		.pipe(plumber(plumberNotify('SVG:dev'))) // Обробка помилок під час виконання завдання
		.pipe(svgsprite(svgStack)) // Використання конфігурації svgStack для створення спрайту
		.pipe(gulp.dest('./build/img/svgsprite/')); // Збереження результату в вказаній директорії
});

// Завдання для генерації SVG символів
gulp.task('svgSymbol:dev', function () {
	return gulp
		.src('./src/img/svgicons/**/*.svg') // Вибір усіх SVG файлів у вказаній директорії
		.pipe(plumber(plumberNotify('SVG:dev'))) // Обробка помилок під час виконання завдання
		.pipe(svgsprite(svgSymbol)) // Використання конфігурації svgSymbol для створення спрайту символів
		.pipe(gulp.dest('./build/img/svgsprite/')); // Збереження результату в вказаній директорії
});


// Завдання для копіювання всіх файлів з папки src/files до build/files
// Це може включати статичні файли, такі як документи, PDF-файли або архіви, які не потребують обробки
gulp.task('files:dev', function () {
	return gulp
		.src('./src/files/**/*') // Вибираємо всі файли та папки всередині src/files
		.pipe(changed('./build/files/')) // Перевіряємо, чи файл був змінений перед копіюванням, для оптимізації процесу
		.pipe(gulp.dest('./build/files/')); // Копіюємо файли до директорії build/files
});

// Завдання для обробки JavaScript файлів
// Включає транспіляцію коду за допомогою Babel (якщо розкоментувати), а також пакування модулів за допомогою Webpack
gulp.task('js:dev', function () {
	return gulp
		.src('./src/js/*.js') // Вибираємо всі JavaScript файли у директорії src/js
		.pipe(changed('./build/js/')) // Перевіряємо, чи файл був змінений перед обробкою, для оптимізації процесу
		.pipe(plumber(plumberNotify('JS'))) // Використовуємо plumber для обробки помилок під час виконання завдання, щоб не переривати Gulp-потік
		// .pipe(babel()) // Розкоментуйте для включення транспіляції коду через Babel
		.pipe(webpack(require('./../webpack.config.js'))) // Використовуємо Webpack для пакування JavaScript модулів
		.pipe(gulp.dest('./build/js/')); // Зберігаємо оброблені файли у директорії build/js
});

// Налаштування сервера livereload
const serverOptions = {
	livereload: true,
	open: true,
};

// Завдання для запуску сервера з livereload для автоматичного перезавантаження сторінки в браузері
gulp.task('server:dev', function () {
	return gulp.src('./build/').pipe(server(serverOptions));
});

// Завдання для відстеження змін у файлах проекту під час розробки
gulp.task('watch:dev', function () {
    // Відстеження змін у SCSS файлах
	gulp.watch('./src/scss/**/*.scss', gulp.parallel('sass:dev'));
    // Паралельне виконання завдання sass:dev при зміні в будь-якому SCSS файлі

    // Відстеження змін у HTML файлах та JSON (якщо використовуються для даних)
	gulp.watch(
		['./src/html/**/*.html', './src/html/**/*.json'],
		gulp.parallel('html:dev')
	);
    // Паралельне виконання завдання html:dev при зміні в будь-якому HTML або JSON файлі

    // Відстеження змін у зображеннях
	gulp.watch('./src/img/**/*', gulp.parallel('images:dev'));
    // Паралельне виконання завдання images:dev при зміні в будь-якому файлі зображення

    // Відстеження змін у додаткових файлах проекту, таких як документи чи архіви
	gulp.watch('./src/files/**/*', gulp.parallel('files:dev'));
    // Паралельне виконання завдання files:dev при зміні в будь-якому файлі з папки files

    // Відстеження змін у JavaScript файлах
	gulp.watch('./src/js/**/*.js', gulp.parallel('js:dev'));
    // Паралельне виконання завдання js:dev при зміні в будь-якому JS файлі

    // Відстеження змін у SVG іконках для генерації спрайтів
	gulp.watch(
		'./src/img/svgicons/*',
		gulp.series('svgStack:dev', 'svgSymbol:dev')
	);
    // Послідовне виконання завдань svgStack:dev та svgSymbol:dev при зміні в будь-якому SVG файлі
});
