/*! full_ui_all.js
 * contains the following files: Detector.js, CanvasRenderer.js, TrackballControls.js, OrthographicTrackballControls.js, Projector.js, icn3d.js, full_ui.js
 */

/*! Detector.js
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

var Detector = {

    canvas: !! window.CanvasRenderingContext2D,
    webgl: ( function () {

        try {

            var canvas = document.createElement( 'canvas' ); return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );

        } catch ( e ) {

            return false;

        }

    } )(),
    workers: !! window.Worker,
    fileapi: window.File && window.FileReader && window.FileList && window.Blob,

    getWebGLErrorMessage: function () {

        var element = document.createElement( 'div' );
        element.id = 'webgl-error-message';
        element.style.fontFamily = 'monospace';
        element.style.fontSize = '13px';
        element.style.fontWeight = 'normal';
        element.style.textAlign = 'center';
        element.style.background = '#fff';
        element.style.color = '#000';
        element.style.padding = '1.5em';
        element.style.width = '400px';
        element.style.margin = '5em auto 0';

        if ( ! this.webgl ) {

            element.innerHTML = window.WebGLRenderingContext ? [
                'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
                'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
            ].join( '\n' ) : [
                'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
                'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
            ].join( '\n' );

        }

        return element;

    },

    addGetWebGLMessage: function ( parameters ) {

        var parent, id, element;

        parameters = parameters || {};

        parent = parameters.parent !== undefined ? parameters.parent : document.body;
        id = parameters.id !== undefined ? parameters.id : 'oldie';

        element = Detector.getWebGLErrorMessage();
        element.id = id;

        parent.appendChild( element );

    }

};

// browserify support
if ( typeof module === 'object' ) {

    module.exports = Detector;

}

/*! CanvasRenderer.js
 * @author mrdoob / http://mrdoob.com/
 */

THREE.SpriteCanvasMaterial = function ( parameters ) {

    THREE.Material.call( this );

    this.type = 'SpriteCanvasMaterial';

    this.color = new THREE.Color( 0xffffff );
    this.program = function ( context, color ) {};

    this.setValues( parameters );

};

THREE.SpriteCanvasMaterial.prototype = Object.create( THREE.Material.prototype );
THREE.SpriteCanvasMaterial.prototype.constructor = THREE.SpriteCanvasMaterial;

THREE.SpriteCanvasMaterial.prototype.clone = function () {

    var material = new THREE.SpriteCanvasMaterial();

    material.copy( this );
    material.color.copy( this.color );
    material.program = this.program;

    return material;

};

//

THREE.CanvasRenderer = function ( parameters ) {

    //console.log( 'THREE.CanvasRenderer', THREE.REVISION );

    var smoothstep = THREE.Math.smoothstep;

    parameters = parameters || {};

    var _this = this,
    _renderData, _elements, _lights,
    _projector = new THREE.Projector(),

    _canvas = parameters.canvas !== undefined
             ? parameters.canvas
             : document.createElement( 'canvas' ),

    _canvasWidth = _canvas.width,
    _canvasHeight = _canvas.height,
    _canvasWidthHalf = Math.floor( _canvasWidth / 2 ),
    _canvasHeightHalf = Math.floor( _canvasHeight / 2 ),

    _viewportX = 0,
    _viewportY = 0,
    _viewportWidth = _canvasWidth,
    _viewportHeight = _canvasHeight,

    pixelRatio = 1,

    _context = _canvas.getContext( '2d', {
        alpha: parameters.alpha === true
    } ),

    _clearColor = new THREE.Color( 0x000000 ),
    _clearAlpha = parameters.alpha === true ? 0 : 1,

    _contextGlobalAlpha = 1,
    _contextGlobalCompositeOperation = 0,
    _contextStrokeStyle = null,
    _contextFillStyle = null,
    _contextLineWidth = null,
    _contextLineCap = null,
    _contextLineJoin = null,
    _contextLineDash = [],

    _camera,

    _v1, _v2, _v3, _v4,
    _v5 = new THREE.RenderableVertex(),
    _v6 = new THREE.RenderableVertex(),

    _v1x, _v1y, _v2x, _v2y, _v3x, _v3y,
    _v4x, _v4y, _v5x, _v5y, _v6x, _v6y,

    _color = new THREE.Color(),
    _color1 = new THREE.Color(),
    _color2 = new THREE.Color(),
    _color3 = new THREE.Color(),
    _color4 = new THREE.Color(),

    _diffuseColor = new THREE.Color(),
    _emissiveColor = new THREE.Color(),

    _lightColor = new THREE.Color(),

    _patterns = {},

    _image, _uvs,
    _uv1x, _uv1y, _uv2x, _uv2y, _uv3x, _uv3y,

    _clipBox = new THREE.Box2(),
    _clearBox = new THREE.Box2(),
    _elemBox = new THREE.Box2(),

    _ambientLight = new THREE.Color(),
    _directionalLights = new THREE.Color(),
    _pointLights = new THREE.Color(),

    _vector3 = new THREE.Vector3(), // Needed for PointLight
    _centroid = new THREE.Vector3(),
    _normal = new THREE.Vector3(),
    _normalViewMatrix = new THREE.Matrix3();

    // dash+gap fallbacks for Firefox and everything else

    if ( _context.setLineDash === undefined ) {

        _context.setLineDash = function () {}

    }

    this.domElement = _canvas;

    this.autoClear = true;
    this.sortObjects = true;
    this.sortElements = true;

    this.info = {

        render: {

            vertices: 0,
            faces: 0

        }

    };

    // WebGLRenderer compatibility

    this.supportsVertexTextures = function () {};
    this.setFaceCulling = function () {};

    // API

    this.getContext = function () {

        return _context;

    };

    this.getContextAttributes = function () {

        return _context.getContextAttributes();

    };

    this.getPixelRatio = function () {

        return pixelRatio;

    };

    this.setPixelRatio = function ( value ) {

        if ( value !== undefined ) pixelRatio = value;

    };

    this.setSize = function ( width, height, updateStyle ) {

        _canvasWidth = width * pixelRatio;
        _canvasHeight = height * pixelRatio;

        _canvas.width = _canvasWidth;
        _canvas.height = _canvasHeight;

        _canvasWidthHalf = Math.floor( _canvasWidth / 2 );
        _canvasHeightHalf = Math.floor( _canvasHeight / 2 );

        if ( updateStyle !== false ) {

            _canvas.style.width = width + 'px';
            _canvas.style.height = height + 'px';

        }

        _clipBox.min.set( - _canvasWidthHalf, - _canvasHeightHalf );
        _clipBox.max.set(   _canvasWidthHalf,   _canvasHeightHalf );

        _clearBox.min.set( - _canvasWidthHalf, - _canvasHeightHalf );
        _clearBox.max.set(   _canvasWidthHalf,   _canvasHeightHalf );

        _contextGlobalAlpha = 1;
        _contextGlobalCompositeOperation = 0;
        _contextStrokeStyle = null;
        _contextFillStyle = null;
        _contextLineWidth = null;
        _contextLineCap = null;
        _contextLineJoin = null;

        this.setViewport( 0, 0, width, height );

    };

    this.setViewport = function ( x, y, width, height ) {

        _viewportX = x * pixelRatio;
        _viewportY = y * pixelRatio;

        _viewportWidth = width * pixelRatio;
        _viewportHeight = height * pixelRatio;

    };

    this.setScissor = function () {};
    this.enableScissorTest = function () {};

    this.setClearColor = function ( color, alpha ) {

        _clearColor.set( color );
        _clearAlpha = alpha !== undefined ? alpha : 1;

        _clearBox.min.set( - _canvasWidthHalf, - _canvasHeightHalf );
        _clearBox.max.set(   _canvasWidthHalf,   _canvasHeightHalf );

    };

    this.setClearColorHex = function ( hex, alpha ) {

        console.warn( 'THREE.CanvasRenderer: .setClearColorHex() is being removed. Use .setClearColor() instead.' );
        this.setClearColor( hex, alpha );

    };

    this.getClearColor = function () {

        return _clearColor;

    };

    this.getClearAlpha = function () {

        return _clearAlpha;

    };

    this.getMaxAnisotropy = function () {

        return 0;

    };

    this.clear = function () {

        if ( _clearBox.empty() === false ) {

            _clearBox.intersect( _clipBox );
            _clearBox.expandByScalar( 2 );

            _clearBox.min.x = _clearBox.min.x + _canvasWidthHalf;
            _clearBox.min.y =  - _clearBox.min.y + _canvasHeightHalf;        // higher y value !
            _clearBox.max.x = _clearBox.max.x + _canvasWidthHalf;
            _clearBox.max.y =  - _clearBox.max.y + _canvasHeightHalf;        // lower y value !

            if ( _clearAlpha < 1 ) {

                _context.clearRect(
                    _clearBox.min.x | 0,
                    _clearBox.max.y | 0,
                    ( _clearBox.max.x - _clearBox.min.x ) | 0,
                    ( _clearBox.min.y - _clearBox.max.y ) | 0
                );

            }

            if ( _clearAlpha > 0 ) {

                setBlending( THREE.NormalBlending );
                setOpacity( 1 );

                setFillStyle( 'rgba(' + Math.floor( _clearColor.r * 255 ) + ',' + Math.floor( _clearColor.g * 255 ) + ',' + Math.floor( _clearColor.b * 255 ) + ',' + _clearAlpha + ')' );

                _context.fillRect(
                    _clearBox.min.x | 0,
                    _clearBox.max.y | 0,
                    ( _clearBox.max.x - _clearBox.min.x ) | 0,
                    ( _clearBox.min.y - _clearBox.max.y ) | 0
                );

            }

            _clearBox.makeEmpty();

        }

    };

    // compatibility

    this.clearColor = function () {};
    this.clearDepth = function () {};
    this.clearStencil = function () {};

    this.render = function ( scene, camera ) {

        if ( camera instanceof THREE.Camera === false ) {

            console.error( 'THREE.CanvasRenderer.render: camera is not an instance of THREE.Camera.' );
            return;

        }

        if ( this.autoClear === true ) this.clear();

        _this.info.render.vertices = 0;
        _this.info.render.faces = 0;

        _context.setTransform( _viewportWidth / _canvasWidth, 0, 0, - _viewportHeight / _canvasHeight, _viewportX, _canvasHeight - _viewportY );
        _context.translate( _canvasWidthHalf, _canvasHeightHalf );

        _renderData = _projector.projectScene( scene, camera, this.sortObjects, this.sortElements );
        _elements = _renderData.elements;
        _lights = _renderData.lights;
        _camera = camera;

        _normalViewMatrix.getNormalMatrix( camera.matrixWorldInverse );

        /* DEBUG
        setFillStyle( 'rgba( 0, 255, 255, 0.5 )' );
        _context.fillRect( _clipBox.min.x, _clipBox.min.y, _clipBox.max.x - _clipBox.min.x, _clipBox.max.y - _clipBox.min.y );
        */

        calculateLights();

        for ( var e = 0, el = _elements.length; e < el; e ++ ) {

            var element = _elements[ e ];

            var material = element.material;

            if ( material === undefined || material.opacity === 0 ) continue;

            _elemBox.makeEmpty();

            if ( element instanceof THREE.RenderableSprite ) {

                _v1 = element;
                _v1.x *= _canvasWidthHalf; _v1.y *= _canvasHeightHalf;

                renderSprite( _v1, element, material );

            } else if ( element instanceof THREE.RenderableLine ) {

                _v1 = element.v1; _v2 = element.v2;

                _v1.positionScreen.x *= _canvasWidthHalf; _v1.positionScreen.y *= _canvasHeightHalf;
                _v2.positionScreen.x *= _canvasWidthHalf; _v2.positionScreen.y *= _canvasHeightHalf;

                _elemBox.setFromPoints( [
                    _v1.positionScreen,
                    _v2.positionScreen
                ] );

                if ( _clipBox.isIntersectionBox( _elemBox ) === true ) {

                    renderLine( _v1, _v2, element, material );

                }

            } else if ( element instanceof THREE.RenderableFace ) {

                _v1 = element.v1; _v2 = element.v2; _v3 = element.v3;

                if ( _v1.positionScreen.z < - 1 || _v1.positionScreen.z > 1 ) continue;
                if ( _v2.positionScreen.z < - 1 || _v2.positionScreen.z > 1 ) continue;
                if ( _v3.positionScreen.z < - 1 || _v3.positionScreen.z > 1 ) continue;

                _v1.positionScreen.x *= _canvasWidthHalf; _v1.positionScreen.y *= _canvasHeightHalf;
                _v2.positionScreen.x *= _canvasWidthHalf; _v2.positionScreen.y *= _canvasHeightHalf;
                _v3.positionScreen.x *= _canvasWidthHalf; _v3.positionScreen.y *= _canvasHeightHalf;

                if ( material.overdraw > 0 ) {

                    expand( _v1.positionScreen, _v2.positionScreen, material.overdraw );
                    expand( _v2.positionScreen, _v3.positionScreen, material.overdraw );
                    expand( _v3.positionScreen, _v1.positionScreen, material.overdraw );

                }

                _elemBox.setFromPoints( [
                    _v1.positionScreen,
                    _v2.positionScreen,
                    _v3.positionScreen
                ] );

                if ( _clipBox.isIntersectionBox( _elemBox ) === true ) {

                    renderFace3( _v1, _v2, _v3, 0, 1, 2, element, material );

                }

            }

            /* DEBUG
            setLineWidth( 1 );
            setStrokeStyle( 'rgba( 0, 255, 0, 0.5 )' );
            _context.strokeRect( _elemBox.min.x, _elemBox.min.y, _elemBox.max.x - _elemBox.min.x, _elemBox.max.y - _elemBox.min.y );
            */

            _clearBox.union( _elemBox );

        }

        /* DEBUG
        setLineWidth( 1 );
        setStrokeStyle( 'rgba( 255, 0, 0, 0.5 )' );
        _context.strokeRect( _clearBox.min.x, _clearBox.min.y, _clearBox.max.x - _clearBox.min.x, _clearBox.max.y - _clearBox.min.y );
        */

        _context.setTransform( 1, 0, 0, 1, 0, 0 );

    };

    //

    function calculateLights() {

        _ambientLight.setRGB( 0, 0, 0 );
        _directionalLights.setRGB( 0, 0, 0 );
        _pointLights.setRGB( 0, 0, 0 );

        for ( var l = 0, ll = _lights.length; l < ll; l ++ ) {

            var light = _lights[ l ];
            var lightColor = light.color;

            if ( light instanceof THREE.AmbientLight ) {

                _ambientLight.add( lightColor );

            } else if ( light instanceof THREE.DirectionalLight ) {

                // for sprites

                _directionalLights.add( lightColor );

            } else if ( light instanceof THREE.PointLight ) {

                // for sprites

                _pointLights.add( lightColor );

            }

        }

    }

    function calculateLight( position, normal, color ) {

        for ( var l = 0, ll = _lights.length; l < ll; l ++ ) {

            var light = _lights[ l ];

            _lightColor.copy( light.color );

            if ( light instanceof THREE.DirectionalLight ) {

                var lightPosition = _vector3.setFromMatrixPosition( light.matrixWorld ).normalize();

                var amount = normal.dot( lightPosition );

                if ( amount <= 0 ) continue;

                amount *= light.intensity;

                color.add( _lightColor.multiplyScalar( amount ) );

            } else if ( light instanceof THREE.PointLight ) {

                var lightPosition = _vector3.setFromMatrixPosition( light.matrixWorld );

                var amount = normal.dot( _vector3.subVectors( lightPosition, position ).normalize() );

                if ( amount <= 0 ) continue;

                amount *= light.distance == 0 ? 1 : 1 - Math.min( position.distanceTo( lightPosition ) / light.distance, 1 );

                if ( amount == 0 ) continue;

                amount *= light.intensity;

                color.add( _lightColor.multiplyScalar( amount ) );

            }

        }

    }

    function renderSprite( v1, element, material ) {

        setOpacity( material.opacity );
        setBlending( material.blending );

        var scaleX = element.scale.x * _canvasWidthHalf;
        var scaleY = element.scale.y * _canvasHeightHalf;

        var dist = 0.5 * Math.sqrt( scaleX * scaleX + scaleY * scaleY ); // allow for rotated sprite
        _elemBox.min.set( v1.x - dist, v1.y - dist );
        _elemBox.max.set( v1.x + dist, v1.y + dist );

        if ( material instanceof THREE.SpriteMaterial ) {

            var texture = material.map;

            if ( texture !== null ) {

                var pattern = _patterns[ texture.id ];

                if ( pattern === undefined || pattern.version !== texture.version ) {

                    pattern = textureToPattern( texture );
                    _patterns[ texture.id ] = pattern;

                }

                if ( pattern.canvas !== undefined ) {

                    setFillStyle( pattern.canvas );

                    var bitmap = texture.image;

                    var ox = bitmap.width * texture.offset.x;
                    var oy = bitmap.height * texture.offset.y;

                    var sx = bitmap.width * texture.repeat.x;
                    var sy = bitmap.height * texture.repeat.y;

                    var cx = scaleX / sx;
                    var cy = scaleY / sy;

                    _context.save();
                    _context.translate( v1.x, v1.y );
                    if ( material.rotation !== 0 ) _context.rotate( material.rotation );
                    _context.translate( - scaleX / 2, - scaleY / 2 );
                    _context.scale( cx, cy );
                    _context.translate( - ox, - oy );
                    _context.fillRect( ox, oy, sx, sy );
                    _context.restore();

                }

            } else {

                // no texture

                setFillStyle( material.color.getStyle() );

                _context.save();
                _context.translate( v1.x, v1.y );
                if ( material.rotation !== 0 ) _context.rotate( material.rotation );
                _context.scale( scaleX, - scaleY );
                _context.fillRect( - 0.5, - 0.5, 1, 1 );
                _context.restore();

            }

        } else if ( material instanceof THREE.SpriteCanvasMaterial ) {

            setStrokeStyle( material.color.getStyle() );
            setFillStyle( material.color.getStyle() );

            _context.save();
            _context.translate( v1.x, v1.y );
            if ( material.rotation !== 0 ) _context.rotate( material.rotation );
            _context.scale( scaleX, scaleY );

            material.program( _context );

            _context.restore();

        }

        /* DEBUG
        setStrokeStyle( 'rgb(255,255,0)' );
        _context.beginPath();
        _context.moveTo( v1.x - 10, v1.y );
        _context.lineTo( v1.x + 10, v1.y );
        _context.moveTo( v1.x, v1.y - 10 );
        _context.lineTo( v1.x, v1.y + 10 );
        _context.stroke();
        */

    }

    function renderLine( v1, v2, element, material ) {

        setOpacity( material.opacity );
        setBlending( material.blending );

        _context.beginPath();
        _context.moveTo( v1.positionScreen.x, v1.positionScreen.y );
        _context.lineTo( v2.positionScreen.x, v2.positionScreen.y );

        if ( material instanceof THREE.LineBasicMaterial ) {

            setLineWidth( material.linewidth );
            setLineCap( material.linecap );
            setLineJoin( material.linejoin );

            if ( material.vertexColors !== THREE.VertexColors ) {

                setStrokeStyle( material.color.getStyle() );

            } else {

                var colorStyle1 = element.vertexColors[ 0 ].getStyle();
                var colorStyle2 = element.vertexColors[ 1 ].getStyle();

                if ( colorStyle1 === colorStyle2 ) {

                    setStrokeStyle( colorStyle1 );

                } else {

                    try {

                        var grad = _context.createLinearGradient(
                            v1.positionScreen.x,
                            v1.positionScreen.y,
                            v2.positionScreen.x,
                            v2.positionScreen.y
                        );
                        grad.addColorStop( 0, colorStyle1 );
                        grad.addColorStop( 1, colorStyle2 );

                    } catch ( exception ) {

                        grad = colorStyle1;

                    }

                    setStrokeStyle( grad );

                }

            }

            _context.stroke();
            _elemBox.expandByScalar( material.linewidth * 2 );

        } else if ( material instanceof THREE.LineDashedMaterial ) {

            setLineWidth( material.linewidth );
            setLineCap( material.linecap );
            setLineJoin( material.linejoin );
            setStrokeStyle( material.color.getStyle() );
            setLineDash( [ material.dashSize, material.gapSize ] );

            _context.stroke();

            _elemBox.expandByScalar( material.linewidth * 2 );

            setLineDash( [] );

        }

    }

    function renderFace3( v1, v2, v3, uv1, uv2, uv3, element, material ) {

        _this.info.render.vertices += 3;
        _this.info.render.faces ++;

        setOpacity( material.opacity );
        setBlending( material.blending );

        _v1x = v1.positionScreen.x; _v1y = v1.positionScreen.y;
        _v2x = v2.positionScreen.x; _v2y = v2.positionScreen.y;
        _v3x = v3.positionScreen.x; _v3y = v3.positionScreen.y;

        drawTriangle( _v1x, _v1y, _v2x, _v2y, _v3x, _v3y );

        if ( ( material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshPhongMaterial ) && material.map === null ) {

            _diffuseColor.copy( material.color );
            _emissiveColor.copy( material.emissive );

            if ( material.vertexColors === THREE.FaceColors ) {

                _diffuseColor.multiply( element.color );

            }

            _color.copy( _ambientLight );

            _centroid.copy( v1.positionWorld ).add( v2.positionWorld ).add( v3.positionWorld ).divideScalar( 3 );

            calculateLight( _centroid, element.normalModel, _color );

            _color.multiply( _diffuseColor ).add( _emissiveColor );

            material.wireframe === true
                 ? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
                 : fillPath( _color );

        } else if ( material instanceof THREE.MeshBasicMaterial ||
                    material instanceof THREE.MeshLambertMaterial ||
                    material instanceof THREE.MeshPhongMaterial ) {

            if ( material.map !== null ) {

                var mapping = material.map.mapping;

                if ( mapping === THREE.UVMapping ) {

                    _uvs = element.uvs;
                    patternPath( _v1x, _v1y, _v2x, _v2y, _v3x, _v3y, _uvs[ uv1 ].x, _uvs[ uv1 ].y, _uvs[ uv2 ].x, _uvs[ uv2 ].y, _uvs[ uv3 ].x, _uvs[ uv3 ].y, material.map );

                }

            } else if ( material.envMap !== null ) {

                if ( material.envMap.mapping === THREE.SphericalReflectionMapping ) {

                    _normal.copy( element.vertexNormalsModel[ uv1 ] ).applyMatrix3( _normalViewMatrix );
                    _uv1x = 0.5 * _normal.x + 0.5;
                    _uv1y = 0.5 * _normal.y + 0.5;

                    _normal.copy( element.vertexNormalsModel[ uv2 ] ).applyMatrix3( _normalViewMatrix );
                    _uv2x = 0.5 * _normal.x + 0.5;
                    _uv2y = 0.5 * _normal.y + 0.5;

                    _normal.copy( element.vertexNormalsModel[ uv3 ] ).applyMatrix3( _normalViewMatrix );
                    _uv3x = 0.5 * _normal.x + 0.5;
                    _uv3y = 0.5 * _normal.y + 0.5;

                    patternPath( _v1x, _v1y, _v2x, _v2y, _v3x, _v3y, _uv1x, _uv1y, _uv2x, _uv2y, _uv3x, _uv3y, material.envMap );

                }

            } else {

                _color.copy( material.color );

                if ( material.vertexColors === THREE.FaceColors ) {

                    _color.multiply( element.color );

                }

                material.wireframe === true
                     ? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
                     : fillPath( _color );

            }

        } else if ( material instanceof THREE.MeshDepthMaterial ) {

            _color.r = _color.g = _color.b = 1 - smoothstep( v1.positionScreen.z * v1.positionScreen.w, _camera.near, _camera.far );

            material.wireframe === true
                     ? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
                     : fillPath( _color );

        } else if ( material instanceof THREE.MeshNormalMaterial ) {

            _normal.copy( element.normalModel ).applyMatrix3( _normalViewMatrix );

            _color.setRGB( _normal.x, _normal.y, _normal.z ).multiplyScalar( 0.5 ).addScalar( 0.5 );

            material.wireframe === true
                 ? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
                 : fillPath( _color );

        } else {

            _color.setRGB( 1, 1, 1 );

            material.wireframe === true
                 ? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
                 : fillPath( _color );

        }

    }

    //

    function drawTriangle( x0, y0, x1, y1, x2, y2 ) {

        _context.beginPath();
        _context.moveTo( x0, y0 );
        _context.lineTo( x1, y1 );
        _context.lineTo( x2, y2 );
        _context.closePath();

    }

    function strokePath( color, linewidth, linecap, linejoin ) {

        setLineWidth( linewidth );
        setLineCap( linecap );
        setLineJoin( linejoin );
        setStrokeStyle( color.getStyle() );

        _context.stroke();

        _elemBox.expandByScalar( linewidth * 2 );

    }

    function fillPath( color ) {

        setFillStyle( color.getStyle() );
        _context.fill();

    }

    function textureToPattern( texture ) {

        if ( texture.version === 0 ||
            texture instanceof THREE.CompressedTexture ||
            texture instanceof THREE.DataTexture ) {

            return {
                    canvas: undefined,
                    version: texture.version
                }

        }

        var image = texture.image;

        var canvas = document.createElement( 'canvas' );
        canvas.width = image.width;
        canvas.height = image.height;

        var context = canvas.getContext( '2d' );
        context.setTransform( 1, 0, 0, - 1, 0, image.height );
        context.drawImage( image, 0, 0 );

        var repeatX = texture.wrapS === THREE.RepeatWrapping;
        var repeatY = texture.wrapT === THREE.RepeatWrapping;

        var repeat = 'no-repeat';

        if ( repeatX === true && repeatY === true ) {

            repeat = 'repeat';

        } else if ( repeatX === true ) {

            repeat = 'repeat-x';

        } else if ( repeatY === true ) {

            repeat = 'repeat-y';

        }

        return {
            canvas: _context.createPattern( canvas, repeat ),
            version: texture.version
        }

    }

    function patternPath( x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, texture ) {

        var pattern = _patterns[ texture.id ];

        if ( pattern === undefined || pattern.version !== texture.version ) {

            pattern = textureToPattern( texture );
            _patterns[ texture.id ] = pattern;

        }

        if ( pattern.canvas !== undefined ) {

            setFillStyle( pattern.canvas );

        } else {

            setFillStyle( 'rgba( 0, 0, 0, 1)' );
            _context.fill();
            return;

        }

        // http://extremelysatisfactorytotalitarianism.com/blog/?p=2120

        var a, b, c, d, e, f, det, idet,
        offsetX = texture.offset.x / texture.repeat.x,
        offsetY = texture.offset.y / texture.repeat.y,
        width = texture.image.width * texture.repeat.x,
        height = texture.image.height * texture.repeat.y;

        u0 = ( u0 + offsetX ) * width;
        v0 = ( v0 + offsetY ) * height;

        u1 = ( u1 + offsetX ) * width;
        v1 = ( v1 + offsetY ) * height;

        u2 = ( u2 + offsetX ) * width;
        v2 = ( v2 + offsetY ) * height;

        x1 -= x0; y1 -= y0;
        x2 -= x0; y2 -= y0;

        u1 -= u0; v1 -= v0;
        u2 -= u0; v2 -= v0;

        det = u1 * v2 - u2 * v1;

        if ( det === 0 ) return;

        idet = 1 / det;

        a = ( v2 * x1 - v1 * x2 ) * idet;
        b = ( v2 * y1 - v1 * y2 ) * idet;
        c = ( u1 * x2 - u2 * x1 ) * idet;
        d = ( u1 * y2 - u2 * y1 ) * idet;

        e = x0 - a * u0 - c * v0;
        f = y0 - b * u0 - d * v0;

        _context.save();
        _context.transform( a, b, c, d, e, f );
        _context.fill();
        _context.restore();

    }

    function clipImage( x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, image ) {

        // http://extremelysatisfactorytotalitarianism.com/blog/?p=2120

        var a, b, c, d, e, f, det, idet,
        width = image.width - 1,
        height = image.height - 1;

        u0 *= width; v0 *= height;
        u1 *= width; v1 *= height;
        u2 *= width; v2 *= height;

        x1 -= x0; y1 -= y0;
        x2 -= x0; y2 -= y0;

        u1 -= u0; v1 -= v0;
        u2 -= u0; v2 -= v0;

        det = u1 * v2 - u2 * v1;

        idet = 1 / det;

        a = ( v2 * x1 - v1 * x2 ) * idet;
        b = ( v2 * y1 - v1 * y2 ) * idet;
        c = ( u1 * x2 - u2 * x1 ) * idet;
        d = ( u1 * y2 - u2 * y1 ) * idet;

        e = x0 - a * u0 - c * v0;
        f = y0 - b * u0 - d * v0;

        _context.save();
        _context.transform( a, b, c, d, e, f );
        _context.clip();
        _context.drawImage( image, 0, 0 );
        _context.restore();

    }

    // Hide anti-alias gaps

    function expand( v1, v2, pixels ) {

        var x = v2.x - v1.x, y = v2.y - v1.y,
        det = x * x + y * y, idet;

        if ( det === 0 ) return;

        idet = pixels / Math.sqrt( det );

        x *= idet; y *= idet;

        v2.x += x; v2.y += y;
        v1.x -= x; v1.y -= y;

    }

    // Context cached methods.

    function setOpacity( value ) {

        if ( _contextGlobalAlpha !== value ) {

            _context.globalAlpha = value;
            _contextGlobalAlpha = value;

        }

    }

    function setBlending( value ) {

        if ( _contextGlobalCompositeOperation !== value ) {

            if ( value === THREE.NormalBlending ) {

                _context.globalCompositeOperation = 'source-over';

            } else if ( value === THREE.AdditiveBlending ) {

                _context.globalCompositeOperation = 'lighter';

            } else if ( value === THREE.SubtractiveBlending ) {

                _context.globalCompositeOperation = 'darker';

            }

            _contextGlobalCompositeOperation = value;

        }

    }

    function setLineWidth( value ) {

        if ( _contextLineWidth !== value ) {

            _context.lineWidth = value;
            _contextLineWidth = value;

        }

    }

    function setLineCap( value ) {

        // "butt", "round", "square"

        if ( _contextLineCap !== value ) {

            _context.lineCap = value;
            _contextLineCap = value;

        }

    }

    function setLineJoin( value ) {

        // "round", "bevel", "miter"

        if ( _contextLineJoin !== value ) {

            _context.lineJoin = value;
            _contextLineJoin = value;

        }

    }

    function setStrokeStyle( value ) {

        if ( _contextStrokeStyle !== value ) {

            _context.strokeStyle = value;
            _contextStrokeStyle = value;

        }

    }

    function setFillStyle( value ) {

        if ( _contextFillStyle !== value ) {

            _context.fillStyle = value;
            _contextFillStyle = value;

        }

    }

    function setLineDash( value ) {

        if ( _contextLineDash.length !== value.length ) {

            _context.setLineDash( value );
            _contextLineDash = value;

        }

    }

};

/*! TrackballControls.js from three.js
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin  / http://mark-lundin.com
 */

THREE.TrackballControls = function ( object, domElement, icn3d ) {

    var _this = this;

    this.STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

    this.object = object;
    this.domElement = ( domElement !== undefined ) ? domElement : document;

    // API
    this.enabled = true;

    this.screen = { left: 0, top: 0, width: 0, height: 0 };

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.2;
    this.panSpeed = 0.3;

    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;
    this.noRoll = false;

    this.staticMoving = false;
    this.dynamicDampingFactor = 0.2;

    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

    // internals

    this.target = new THREE.Vector3();

    var EPS = 0.000001;

    var lastPosition = new THREE.Vector3();

    this._state = this.STATE.NONE;
    var _prevState = this.STATE.NONE;

    var _eye = new THREE.Vector3();

    this._rotateStart = new THREE.Vector3();
    this._rotateEnd = new THREE.Vector3();

    this._zoomStart = new THREE.Vector2();
    this._zoomEnd = new THREE.Vector2();

    var _touchZoomDistanceStart = 0;
    var _touchZoomDistanceEnd = 0;

    this._panStart = new THREE.Vector2();
    this._panEnd = new THREE.Vector2();

    // for reset

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();

    // events

    var changeEvent = { type: 'change' };
    var startEvent = { type: 'start'};
    var endEvent = { type: 'end'};


    // methods

    this.handleResize = function () {

        if ( this.domElement === document ) {

            this.screen.left = 0;
            this.screen.top = 0;
            this.screen.width = window.innerWidth;
            this.screen.height = window.innerHeight;

        } else {

            var box = this.domElement.getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
            var d = this.domElement.ownerDocument.documentElement;
            this.screen.left = box.left + window.pageXOffset - d.clientLeft;
            this.screen.top = box.top + window.pageYOffset - d.clientTop;
            this.screen.width = box.width;
            this.screen.height = box.height;

        }

    };

    this.handleEvent = function ( event ) {

        if ( typeof this[ event.type ] === 'function' ) {

            this[ event.type ]( event );

        }

    };

    var getMouseOnScreen = ( function () {

        var vector = new THREE.Vector2();

        return function ( pageX, pageY ) {

            vector.set(
                ( pageX - _this.screen.left ) / _this.screen.width,
                ( pageY - _this.screen.top ) / _this.screen.height
            );

            return vector;

        };

    }() );

    var getMouseProjectionOnBall = ( function () {

        var vector = new THREE.Vector3();
        var objectUp = new THREE.Vector3();
        var mouseOnBall = new THREE.Vector3();

        return function ( pageX, pageY ) {

            mouseOnBall.set(
                ( pageX - _this.screen.width * 0.5 - _this.screen.left ) / (_this.screen.width*.5),
                ( _this.screen.height * 0.5 + _this.screen.top - pageY ) / (_this.screen.height*.5),
                0.0
            );

            var length = mouseOnBall.length();

            if ( _this.noRoll ) {

                if ( length < Math.SQRT1_2 ) {

                    mouseOnBall.z = Math.sqrt( 1.0 - length*length );

                } else {

                    mouseOnBall.z = .5 / length;

                }

            } else if ( length > 1.0 ) {

                mouseOnBall.normalize();

            } else {

                mouseOnBall.z = Math.sqrt( 1.0 - length * length );

            }

            _eye.copy( _this.object.position ).sub( _this.target );

            vector.copy( _this.object.up ).setLength( mouseOnBall.y )
            vector.add( objectUp.copy( _this.object.up ).cross( _eye ).setLength( mouseOnBall.x ) );
            vector.add( _eye.setLength( mouseOnBall.z ) );

            return vector;

        };

    }() );

    this.rotateCamera = (function(quaternionIn, bUpdate){

        var axis = new THREE.Vector3(),
            quaternion = new THREE.Quaternion();


        return function (quaternionIn, bUpdate) {

            var angle;
            if(quaternionIn === undefined) {
              angle = Math.acos( _this._rotateStart.dot( _this._rotateEnd ) / _this._rotateStart.length() / _this._rotateEnd.length() );
            }

            //var angle = Math.acos( _this._rotateStart.dot( _this._rotateEnd ) / _this._rotateStart.length() / _this._rotateEnd.length() );

            if ( angle || quaternionIn !== undefined) {
                if(quaternionIn === undefined) {
                  axis.crossVectors( _this._rotateStart, _this._rotateEnd ).normalize();

                  angle *= _this.rotateSpeed;

                  quaternion.setFromAxisAngle( axis, -angle );
                }
                else {
                  quaternion.copy(quaternionIn);
                }

                // order matters in quaernion multiplication: http://www.cprogramming.com/tutorial/3d/quaternions.html
                if(bUpdate === undefined || bUpdate === true) icn3d.quaternion.multiplyQuaternions(quaternion, icn3d.quaternion);

                _eye.applyQuaternion( quaternion );
                _this.object.up.applyQuaternion( quaternion );

                _this._rotateEnd.applyQuaternion( quaternion );

                if ( _this.staticMoving ) {

                    _this._rotateStart.copy( _this._rotateEnd );

                } else {

                    quaternion.setFromAxisAngle( axis, angle * ( _this.dynamicDampingFactor - 1.0 ) );
                    _this._rotateStart.applyQuaternion( quaternion );

                }
            }

        }

    }());

    this.zoomCamera = function (zoomFactor, bUpdate) {
        if ( _this._state === _this.STATE.TOUCH_ZOOM_PAN ) {

            var factor;

            if(zoomFactor !== undefined) {
              factor = zoomFactor;
            }
            else {

              factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
              _touchZoomDistanceStart = _touchZoomDistanceEnd;
            }

            _eye.multiplyScalar( factor );

            if(bUpdate === undefined || bUpdate === true) icn3d._zoomFactor *= factor;

        } else {

            var factor;

            if(zoomFactor !== undefined) {
              factor = zoomFactor;
            }
            else {
              factor = 1.0 + ( _this._zoomEnd.y - _this._zoomStart.y ) * _this.zoomSpeed;
            }

            if(bUpdate === undefined || bUpdate === true) icn3d._zoomFactor *= factor;

            //if ( factor !== 1.0 && factor > 0.0 ) {
            if ( factor !== 1.0 ) {

                _eye.multiplyScalar( factor );

                if ( _this.staticMoving ) {

                    _this._zoomStart.copy( _this._zoomEnd );

                } else {

                    _this._zoomStart.y += ( _this._zoomEnd.y - _this._zoomStart.y ) * this.dynamicDampingFactor;
                }
            }

        }

    };

    this.panCamera = (function(mouseChangeIn, bUpdate){

        var mouseChange = new THREE.Vector2(),
            objectUp = new THREE.Vector3(),
            pan = new THREE.Vector3();

        return function (mouseChangeIn, bUpdate) {

            if(mouseChangeIn !== undefined) {
              mouseChange = mouseChangeIn;

              if(bUpdate === undefined || bUpdate === true) icn3d.mouseChange.add(mouseChangeIn);
            }
            else {
              mouseChange.copy( _this._panEnd ).sub( _this._panStart );

              if(bUpdate === undefined || bUpdate === true) icn3d.mouseChange.add( _this._panEnd ).sub( _this._panStart );
            }

            if ( mouseChange.lengthSq() ) {
                mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

                pan.copy( _eye ).cross( _this.object.up ).setLength( mouseChange.x );
                pan.add( objectUp.copy( _this.object.up ).setLength( mouseChange.y ) );

                _this.object.position.add( pan );
                _this.target.add( pan );

                if ( _this.staticMoving ) {

                    _this._panStart.copy( _this._panEnd );

                } else {

                    _this._panStart.add( mouseChange.subVectors( _this._panEnd, _this._panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

                }

            }
        }

    }());

    this.checkDistances = function () {

        if ( !_this.noZoom || !_this.noPan ) {

            if ( _eye.lengthSq() > _this.maxDistance * _this.maxDistance ) {

                _this.object.position.addVectors( _this.target, _eye.setLength( _this.maxDistance ) );

            }

            if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

                _this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );

            }

        }

    };

    this.update = function (para) {

        _eye.subVectors( _this.object.position, _this.target );

        if ( !_this.noRotate ) {

            if(para !== undefined && para.quaternion !== undefined) {
              _this.rotateCamera(para.quaternion, para.update);
            }
            else {
              _this.rotateCamera();
            }

        }

        if ( !_this.noZoom ) {

            if(para !== undefined && para._zoomFactor !== undefined) {
              _this.zoomCamera(para._zoomFactor, para.update);
            }
            else {
              _this.zoomCamera();
            }

        }

        if ( !_this.noPan ) {

            if(para !== undefined && para.mouseChange !== undefined) {
              _this.panCamera(para.mouseChange, para.update);
            }
            else {
              _this.panCamera();
            }

        }

        _this.object.position.addVectors( _this.target, _eye );

        _this.checkDistances();

        _this.object.lookAt( _this.target );

        if ( lastPosition.distanceToSquared( _this.object.position ) > EPS ) {

            _this.dispatchEvent( changeEvent );

            lastPosition.copy( _this.object.position );

        }

    };

    this.reset = function () {

        _this._state = _this.STATE.NONE;
        _prevState = _this.STATE.NONE;

        _this.target.copy( _this.target0 );
        _this.object.position.copy( _this.position0 );
        _this.object.up.copy( _this.up0 );

        _eye.subVectors( _this.object.position, _this.target );

        _this.object.lookAt( _this.target );

        _this.dispatchEvent( changeEvent );

        lastPosition.copy( _this.object.position );

    };

    // listeners

    function keydown( event ) {
//console.log("keydown");

        if ( _this.enabled === false ) return;

        window.removeEventListener( 'keydown', keydown );

        _prevState = _this._state;


        if ( _this._state !== _this.STATE.NONE ) {

            return;

        } else if ( event.keyCode === _this.keys[ _this.STATE.ROTATE ] &&  !_this.noRotate) {

            _this._state = _this.STATE.ROTATE;

        } else if ( (event.keyCode === _this.keys[ _this.STATE.ZOOM ] || event.shiftKey) && !_this.noZoom ) {

            _this._state = _this.STATE.ZOOM;

        } else if ( (event.keyCode === _this.keys[ _this.STATE.PAN ] || event.ctrlKey) && !_this.noPan ) {

            _this._state = _this.STATE.PAN;

        }


    }

    function keyup( event ) {
//console.log("keyup");

        if ( _this.enabled === false ) return;

        _this._state = _prevState;

        window.addEventListener( 'keydown', keydown, false );

    }

    function mousedown( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        if ( _this._state === _this.STATE.NONE ) {

            _this._state = event.button;

        }

        if ( _this._state === _this.STATE.ROTATE && !_this.noRotate ) {

            _this._rotateStart.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );
            _this._rotateEnd.copy( _this._rotateStart );

        } else if ( _this._state === _this.STATE.ZOOM && !_this.noZoom ) {

            _this._zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            _this._zoomEnd.copy(_this._zoomStart);

        } else if ( _this._state === _this.STATE.PAN && !_this.noPan ) {

            _this._panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            _this._panEnd.copy(_this._panStart)

        }

        document.addEventListener( 'mousemove', mousemove, false );
        document.addEventListener( 'mouseup', mouseup, false );

        _this.dispatchEvent( startEvent );

    }

    function mousemove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        if ( _this._state === _this.STATE.ROTATE && !_this.noRotate ) {

//console.log("ROTATE");
            _this._rotateEnd.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );

        } else if ( _this._state === _this.STATE.ZOOM && !_this.noZoom ) {

            _this._zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

        } else if ( _this._state === _this.STATE.PAN && !_this.noPan ) {

            _this._panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

        }

    }

    function mouseup( event ) {
        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        _this._state = _this.STATE.NONE;

        document.removeEventListener( 'mousemove', mousemove );
        document.removeEventListener( 'mouseup', mouseup );
        _this.dispatchEvent( endEvent );

    }

    function mousewheel( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        var delta = 0;

        if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

            delta = event.wheelDelta / 40;

        } else if ( event.detail ) { // Firefox

            delta = - event.detail / 3;

        }

        //_this._zoomStart.y += delta * 0.01;
        _this._zoomStart.y = delta * 0.01;
        _this.dispatchEvent( startEvent );
        _this.dispatchEvent( endEvent );

    }

    function touchstart( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {
            case 1:
                _this._state = _this.STATE.TOUCH_ROTATE;
                _this._rotateStart.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                _this._rotateEnd.copy( _this._rotateStart );
                break;

            case 2:
                _this._state = _this.STATE.TOUCH_ZOOM_PAN;
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _this._panStart.copy( getMouseOnScreen( x, y ) );
                _this._panEnd.copy( _this._panStart );
                break;

            default:
                _this._state = _this.STATE.NONE;

        }
        _this.dispatchEvent( startEvent );


    }

    function touchmove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        switch ( event.touches.length ) {

            case 1:
                _this._rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                break;

            case 2:
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _this._panEnd.copy( getMouseOnScreen( x, y ) );
                break;

            default:
                _this._state = _this.STATE.NONE;

        }

    }

    function touchend( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {

            case 1:
                _this._rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                _this._rotateStart.copy( _this._rotateEnd );
                break;

            case 2:
                _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _this._panEnd.copy( getMouseOnScreen( x, y ) );
                _this._panStart.copy( _this._panEnd );
                break;

        }

        _this._state = _this.STATE.NONE;
        _this.dispatchEvent( endEvent );

    }

    this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

    this.domElement.addEventListener( 'mousedown', mousedown, false );

    this.domElement.addEventListener( 'mousewheel', mousewheel, false );
    this.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

    this.domElement.addEventListener( 'touchstart', touchstart, false );
    this.domElement.addEventListener( 'touchend', touchend, false );
    this.domElement.addEventListener( 'touchmove', touchmove, false );

    window.addEventListener( 'keydown', keydown, false );
    window.addEventListener( 'keyup', keyup, false );

    this.handleResize();

    // force an update at start
    this.update();

};

THREE.TrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.TrackballControls.prototype.constructor = THREE.TrackballControls;

/*! OrthographicTrackballControls.js from three.js
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin  / http://mark-lundin.com
 * @author Patrick Fuller / http://patrick-fuller.com
 */

THREE.OrthographicTrackballControls = function ( object, domElement, icn3d ) {

    var _this = this;
    var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

    this.object = object;
    this.domElement = ( domElement !== undefined ) ? domElement : document;

    // API
    this.enabled = true;

    this.screen = { left: 0, top: 0, width: 0, height: 0 };

    // JW: the rotation speed of orthographic should be much less than that of perspective
    //this.rotateSpeed = 1.0;
    this.rotateSpeed = 0.5;
    this.zoomSpeed = 1.2;

    var zoomSpeedAdjust = 0.01;
    this.zoomSpeed *= zoomSpeedAdjust;

    //this.panSpeed = 0.3;
    this.panSpeed = 0.03;

    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;
    this.noRoll = false;

    this.staticMoving = false;
    this.dynamicDampingFactor = 0.2;

    this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

    // internals

    this.target = new THREE.Vector3();

    var EPS = 0.000001;

    var lastPosition = new THREE.Vector3();

    this._state = STATE.NONE;
    var _prevState = STATE.NONE;

    var _eye = new THREE.Vector3();

    this._rotateStart = new THREE.Vector3();
    this._rotateEnd = new THREE.Vector3();

    this._zoomStart = new THREE.Vector2();
    this._zoomEnd = new THREE.Vector2();
    var _zoomFactor = 1;

    var _touchZoomDistanceStart = 0;
    var _touchZoomDistanceEnd = 0;

    this._panStart = new THREE.Vector2();
    this._panEnd = new THREE.Vector2();

    // for reset

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();

    this.left0 = this.object.left;
    this.right0 = this.object.right;
    this.top0 = this.object.top;
    this.bottom0 = this.object.bottom;
    this.center0 = new THREE.Vector2((this.left0 + this.right0) / 2.0, (this.top0 + this.bottom0) / 2.0);

    // events

    var changeEvent = { type: 'change' };
    var startEvent = { type: 'start'};
    var endEvent = { type: 'end'};


    // methods

    this.handleResize = function () {

        if ( this.domElement === document ) {

            this.screen.left = 0;
            this.screen.top = 0;
            this.screen.width = window.innerWidth;
            this.screen.height = window.innerHeight;

        } else {

            var box = this.domElement.getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
            var d = this.domElement.ownerDocument.documentElement;
            this.screen.left = box.left + window.pageXOffset - d.clientLeft;
            this.screen.top = box.top + window.pageYOffset - d.clientTop;
            this.screen.width = box.width;
            this.screen.height = box.height;
        }

        this.left0 = this.object.left;
        this.right0 = this.object.right;
        this.top0 = this.object.top;
        this.bottom0 = this.object.bottom;
        this.center0.set((this.left0 + this.right0) / 2.0, (this.top0 + this.bottom0) / 2.0);

    };

    this.handleEvent = function ( event ) {

        if ( typeof this[ event.type ] === 'function' ) {

            this[ event.type ]( event );

        }

    };

    var getMouseOnScreen = ( function () {

        var vector = new THREE.Vector2();

        return function ( pageX, pageY ) {

            vector.set(
                ( pageX - _this.screen.left ) / _this.screen.width,
                ( pageY - _this.screen.top ) / _this.screen.height
            );

            return vector;

        };

    }() );

    var getMouseProjectionOnBall = ( function () {

        var vector = new THREE.Vector3();
        var objectUp = new THREE.Vector3();
        var mouseOnBall = new THREE.Vector3();

        return function ( pageX, pageY ) {

            mouseOnBall.set(
                ( pageX - _this.screen.width * 0.5 - _this.screen.left ) / (_this.screen.width*.5),
                ( _this.screen.height * 0.5 + _this.screen.top - pageY ) / (_this.screen.height*.5),
                0.0
            );

            var length = mouseOnBall.length();

            if ( _this.noRoll ) {

                if ( length < Math.SQRT1_2 ) {

                    mouseOnBall.z = Math.sqrt( 1.0 - length*length );

                } else {

                    mouseOnBall.z = .5 / length;

                }

            } else if ( length > 1.0 ) {

                mouseOnBall.normalize();

            } else {

                mouseOnBall.z = Math.sqrt( 1.0 - length * length );

            }

            _eye.copy( _this.object.position ).sub( _this.target );

            vector.copy( _this.object.up ).setLength( mouseOnBall.y )
            vector.add( objectUp.copy( _this.object.up ).cross( _eye ).setLength( mouseOnBall.x ) );
            vector.add( _eye.setLength( mouseOnBall.z ) );

            return vector;

        };

    }() );

    this.rotateCamera = (function(quaternionIn, bUpdate){

        var axis = new THREE.Vector3(),
            quaternion = new THREE.Quaternion();

        return function (quaternionIn, bUpdate) {

            var angle;
            if(quaternionIn === undefined) {
              angle = Math.acos( _this._rotateStart.dot( _this._rotateEnd ) / _this._rotateStart.length() / _this._rotateEnd.length() );
            }

            //var angle = Math.acos( _this._rotateStart.dot( _this._rotateEnd ) / _this._rotateStart.length() / _this._rotateEnd.length() );

            if ( angle || quaternionIn !== undefined) {
                if(quaternionIn === undefined) {
                  axis.crossVectors( _this._rotateStart, _this._rotateEnd ).normalize();

                  angle *= _this.rotateSpeed;

                  quaternion.setFromAxisAngle( axis, -angle );
                }
                else {
                  quaternion.copy(quaternionIn);
                }

                // order matters in quaernion multiplication: http://www.cprogramming.com/tutorial/3d/quaternions.html
                if(bUpdate === undefined || bUpdate === true) icn3d.quaternion.multiplyQuaternions(quaternion, icn3d.quaternion);

                _eye.applyQuaternion( quaternion );
                _this.object.up.applyQuaternion( quaternion );

                _this._rotateEnd.applyQuaternion( quaternion );

                if ( _this.staticMoving ) {

                    _this._rotateStart.copy( _this._rotateEnd );

                } else {

                    quaternion.setFromAxisAngle( axis, angle * ( _this.dynamicDampingFactor - 1.0 ) );
                    _this._rotateStart.applyQuaternion( quaternion );

                }

            }
        }

    }());

    this.zoomCamera = function (zoomFactor, bUpdate) {

        var factor;
        if ( _this._state === STATE.TOUCH_ZOOM_PAN ) {

            if(zoomFactor !== undefined) {
              factor = zoomFactor;
            }
            else {

              factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
              _touchZoomDistanceStart = _touchZoomDistanceEnd;
            }

        } else {

            if(zoomFactor !== undefined) {
              factor = zoomFactor;
            }
            else {

              factor = 1.0 + ( _this._zoomEnd.y - _this._zoomStart.y ) * _this.zoomSpeed / zoomSpeedAdjust;
            }
        }

        if(bUpdate === undefined || bUpdate === true) icn3d._zoomFactor *= factor;

        //if ( factor !== 1.0 && factor > 0.0 ) {
        if ( factor !== 1.0 ) {

            //_zoomFactor *= factor;
            _zoomFactor = factor;

            _this.object.left = _zoomFactor * _this.left0 + ( 1 - _zoomFactor ) *  _this.center0.x;
            _this.object.right = _zoomFactor * _this.right0 + ( 1 - _zoomFactor ) *  _this.center0.x;
            _this.object.top = _zoomFactor * _this.top0 + ( 1 - _zoomFactor ) *  _this.center0.y;
            _this.object.bottom = _zoomFactor * _this.bottom0 + ( 1 - _zoomFactor ) *  _this.center0.y;

            if ( _this.staticMoving ) {

                _this._zoomStart.copy( _this._zoomEnd );

            } else {

                _this._zoomStart.y += ( _this._zoomEnd.y - _this._zoomStart.y ) * this.dynamicDampingFactor;

            }

        }

    };

    this.panCamera = (function(mouseChangeIn, bUpdate){

        var mouseChange = new THREE.Vector2(),
            objectUp = new THREE.Vector3(),
            pan = new THREE.Vector3();

        return function (mouseChangeIn, bUpdate) {

            if(mouseChangeIn !== undefined) {
              mouseChange = mouseChangeIn;

              if(bUpdate === undefined || bUpdate === true) icn3d.mouseChange.add(mouseChangeIn);
            }
            else {
              mouseChange.copy( _this._panEnd ).sub( _this._panStart );

              if(bUpdate === undefined || bUpdate === true) icn3d.mouseChange.add( _this._panEnd ).sub( _this._panStart );
            }

            if ( mouseChange.lengthSq() ) {

                mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

                pan.copy( _eye ).cross( _this.object.up ).setLength( mouseChange.x );
                pan.add( objectUp.copy( _this.object.up ).setLength( mouseChange.y ) );

                _this.object.position.add( pan );
                _this.target.add( pan );

                if ( _this.staticMoving ) {

                    _this._panStart.copy( _this._panEnd );

                } else {

                    _this._panStart.add( mouseChange.subVectors( _this._panEnd, _this._panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

                }

            }
        }

    }());

    this.update = function (para) {

        _eye.subVectors( _this.object.position, _this.target );

        if ( !_this.noRotate ) {

            if(para !== undefined && para.quaternion !== undefined) {
              _this.rotateCamera(para.quaternion, para.update);
            }
            else {
              _this.rotateCamera();
            }

        }

        if ( !_this.noZoom ) {

            if(para !== undefined && para._zoomFactor !== undefined) {
              _this.zoomCamera(para._zoomFactor, para.update);
            }
            else {
              _this.zoomCamera();
            }

            _this.object.updateProjectionMatrix();

        }

        if ( !_this.noPan ) {

            if(para !== undefined && para.mouseChange !== undefined) {
              _this.panCamera(para.mouseChange, para.update);
            }
            else {
              _this.panCamera();
            }

        }

        _this.object.position.addVectors( _this.target, _eye );

        _this.object.lookAt( _this.target );

        if ( lastPosition.distanceToSquared( _this.object.position ) > EPS ) {

            _this.dispatchEvent( changeEvent );

            lastPosition.copy( _this.object.position );

        }

    };

    this.reset = function () {

        _this._state = STATE.NONE;
        _prevState = STATE.NONE;

        _this.target.copy( _this.target0 );
        _this.object.position.copy( _this.position0 );
        _this.object.up.copy( _this.up0 );

        _eye.subVectors( _this.object.position, _this.target );

        _this.object.left = _this.left0;
        _this.object.right = _this.right0;
        _this.object.top = _this.top0;
        _this.object.bottom = _this.bottom0;

        _this.object.lookAt( _this.target );

        _this.dispatchEvent( changeEvent );

        lastPosition.copy( _this.object.position );

    };

    // listeners

    function keydown( event ) {

        if ( _this.enabled === false ) return;

        window.removeEventListener( 'keydown', keydown );

        _prevState = _this._state;

        if ( _this._state !== STATE.NONE ) {

            return;

        } else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && !_this.noRotate ) {

            _this._state = STATE.ROTATE;

        } else if ( (event.keyCode === _this.keys[ STATE.ZOOM ] || event.shiftKey) && !_this.noZoom ) {

            _this._state = STATE.ZOOM;

        } else if ( (event.keyCode === _this.keys[ STATE.PAN ] || event.ctrlKey) && !_this.noPan ) {

            _this._state = STATE.PAN;

        }

    }

    function keyup( event ) {

        if ( _this.enabled === false ) return;

        _this._state = _prevState;

        window.addEventListener( 'keydown', keydown, false );

    }

    function mousedown( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        if ( _this._state === STATE.NONE ) {

            _this._state = event.button;

        }

        if ( _this._state === STATE.ROTATE && !_this.noRotate ) {

            _this._rotateStart.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );
            _this._rotateEnd.copy( _this._rotateStart );

        } else if ( _this._state === STATE.ZOOM && !_this.noZoom ) {

            _this._zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            _this._zoomEnd.copy(_this._zoomStart);

        } else if ( _this._state === STATE.PAN && !_this.noPan ) {

            _this._panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            _this._panEnd.copy(_this._panStart)

        }

        document.addEventListener( 'mousemove', mousemove, false );
        document.addEventListener( 'mouseup', mouseup, false );

        _this.dispatchEvent( startEvent );

    }

    function mousemove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        if ( _this._state === STATE.ROTATE && !_this.noRotate ) {

            _this._rotateEnd.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );

        } else if ( _this._state === STATE.ZOOM && !_this.noZoom ) {

            _this._zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

        } else if ( _this._state === STATE.PAN && !_this.noPan ) {

            _this._panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

        }

    }

    function mouseup( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        _this._state = STATE.NONE;

        document.removeEventListener( 'mousemove', mousemove );
        document.removeEventListener( 'mouseup', mouseup );
        _this.dispatchEvent( endEvent );

    }

    function mousewheel( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        var delta = 0;

        if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

            delta = event.wheelDelta / 40;

        } else if ( event.detail ) { // Firefox

            delta = - event.detail / 3;

        }

        //_this._zoomStart.y += delta * 0.01;
        _this._zoomStart.y = delta * 0.01;
        _this.dispatchEvent( startEvent );
        _this.dispatchEvent( endEvent );

    }

    function touchstart( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {

            case 1:
                _this._state = STATE.TOUCH_ROTATE;
                _this._rotateStart.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                _this._rotateEnd.copy( _this._rotateStart );
                break;

            case 2:
                _this._state = STATE.TOUCH_ZOOM_PAN;
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _this._panStart.copy( getMouseOnScreen( x, y ) );
                _this._panEnd.copy( _this._panStart );
                break;

            default:
                _this._state = STATE.NONE;

        }
        _this.dispatchEvent( startEvent );


    }

    function touchmove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        switch ( event.touches.length ) {

            case 1:
                _this._rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                break;

            case 2:
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _this._panEnd.copy( getMouseOnScreen( x, y ) );
                break;

            default:
                _this._state = STATE.NONE;

        }

    }

    function touchend( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {

            case 1:
                _this._rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                _this._rotateStart.copy( _this._rotateEnd );
                break;

            case 2:
                _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _this._panEnd.copy( getMouseOnScreen( x, y ) );
                _this._panStart.copy( _this._panEnd );
                break;

        }

        _this._state = STATE.NONE;
        _this.dispatchEvent( endEvent );

    }

    this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

    this.domElement.addEventListener( 'mousedown', mousedown, false );

    this.domElement.addEventListener( 'mousewheel', mousewheel, false );
    this.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

    this.domElement.addEventListener( 'touchstart', touchstart, false );
    this.domElement.addEventListener( 'touchend', touchend, false );
    this.domElement.addEventListener( 'touchmove', touchmove, false );

    window.addEventListener( 'keydown', keydown, false );
    window.addEventListener( 'keyup', keyup, false );

    this.handleResize();

    // force an update at start
    this.update();

};

THREE.OrthographicTrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrthographicTrackballControls.prototype.constructor = THREE.OrthographicTrackballControls;

/*! Projector.js from three.js
 * @author mrdoob / http://mrdoob.com/
 * @author supereggbert / http://www.paulbrunt.co.uk/
 * @author julianwa / https://github.com/julianwa
 */

THREE.RenderableObject = function () {

    this.id = 0;

    this.object = null;
    this.z = 0;

};

//

THREE.RenderableFace = function () {

    this.id = 0;

    this.v1 = new THREE.RenderableVertex();
    this.v2 = new THREE.RenderableVertex();
    this.v3 = new THREE.RenderableVertex();

    this.normalModel = new THREE.Vector3();

    this.vertexNormalsModel = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
    this.vertexNormalsLength = 0;

    this.color = new THREE.Color();
    this.material = null;
    this.uvs = [ new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2() ];

    this.z = 0;

};

//

THREE.RenderableVertex = function () {

    this.position = new THREE.Vector3();
    this.positionWorld = new THREE.Vector3();
    this.positionScreen = new THREE.Vector4();

    this.visible = true;

};

THREE.RenderableVertex.prototype.copy = function ( vertex ) {

    this.positionWorld.copy( vertex.positionWorld );
    this.positionScreen.copy( vertex.positionScreen );

};

//

THREE.RenderableLine = function () {

    this.id = 0;

    this.v1 = new THREE.RenderableVertex();
    this.v2 = new THREE.RenderableVertex();

    this.vertexColors = [ new THREE.Color(), new THREE.Color() ];
    this.material = null;

    this.z = 0;

};

//

THREE.RenderableSprite = function () {

    this.id = 0;

    this.object = null;

    this.x = 0;
    this.y = 0;
    this.z = 0;

    this.rotation = 0;
    this.scale = new THREE.Vector2();

    this.material = null;

};

//

THREE.Projector = function () {

    var _object, _objectCount, _objectPool = [], _objectPoolLength = 0,
    _vertex, _vertexCount, _vertexPool = [], _vertexPoolLength = 0,
    _face, _faceCount, _facePool = [], _facePoolLength = 0,
    _line, _lineCount, _linePool = [], _linePoolLength = 0,
    _sprite, _spriteCount, _spritePool = [], _spritePoolLength = 0,

    _renderData = { objects: [], lights: [], elements: [] },

    _vA = new THREE.Vector3(),
    _vB = new THREE.Vector3(),
    _vC = new THREE.Vector3(),

    _vector3 = new THREE.Vector3(),
    _vector4 = new THREE.Vector4(),

    _clipBox = new THREE.Box3( new THREE.Vector3( - 1, - 1, - 1 ), new THREE.Vector3( 1, 1, 1 ) ),
    _boundingBox = new THREE.Box3(),
    _points3 = new Array( 3 ),
    _points4 = new Array( 4 ),

    _viewMatrix = new THREE.Matrix4(),
    _viewProjectionMatrix = new THREE.Matrix4(),

    _modelMatrix,
    _modelViewProjectionMatrix = new THREE.Matrix4(),

    _normalMatrix = new THREE.Matrix3(),

    _frustum = new THREE.Frustum(),

    _clippedVertex1PositionScreen = new THREE.Vector4(),
    _clippedVertex2PositionScreen = new THREE.Vector4();

    //

    this.projectVector = function ( vector, camera ) {

        console.warn( 'THREE.Projector: .projectVector() is now vector.project().' );
        vector.project( camera );

    };

    this.unprojectVector = function ( vector, camera ) {

        console.warn( 'THREE.Projector: .unprojectVector() is now vector.unproject().' );
        vector.unproject( camera );

    };

    this.pickingRay = function ( vector, camera ) {

        console.error( 'THREE.Projector: .pickingRay() is now raycaster.setFromCamera().' );

    };

    //

    var RenderList = function () {

        var normals = [];
        var uvs = [];

        var object = null;
        var material = null;

        var normalMatrix = new THREE.Matrix3();

        var setObject = function ( value ) {

            object = value;
            material = object.material;

            normalMatrix.getNormalMatrix( object.matrixWorld );

            normals.length = 0;
            uvs.length = 0;

        };

        var projectVertex = function ( vertex ) {

            var position = vertex.position;
            var positionWorld = vertex.positionWorld;
            var positionScreen = vertex.positionScreen;

            positionWorld.copy( position ).applyMatrix4( _modelMatrix );
            positionScreen.copy( positionWorld ).applyMatrix4( _viewProjectionMatrix );

            var invW = 1 / positionScreen.w;

            positionScreen.x *= invW;
            positionScreen.y *= invW;
            positionScreen.z *= invW;

            vertex.visible = positionScreen.x >= - 1 && positionScreen.x <= 1 &&
                     positionScreen.y >= - 1 && positionScreen.y <= 1 &&
                     positionScreen.z >= - 1 && positionScreen.z <= 1;

        };

        var pushVertex = function ( x, y, z ) {

            _vertex = getNextVertexInPool();
            _vertex.position.set( x, y, z );

            projectVertex( _vertex );

        };

        var pushNormal = function ( x, y, z ) {

            normals.push( x, y, z );

        };

        var pushUv = function ( x, y ) {

            uvs.push( x, y );

        };

        var checkTriangleVisibility = function ( v1, v2, v3 ) {

            if ( v1.visible === true || v2.visible === true || v3.visible === true ) return true;

            _points3[ 0 ] = v1.positionScreen;
            _points3[ 1 ] = v2.positionScreen;
            _points3[ 2 ] = v3.positionScreen;

            return _clipBox.isIntersectionBox( _boundingBox.setFromPoints( _points3 ) );

        };

        var checkBackfaceCulling = function ( v1, v2, v3 ) {

            return ( ( v3.positionScreen.x - v1.positionScreen.x ) *
                    ( v2.positionScreen.y - v1.positionScreen.y ) -
                    ( v3.positionScreen.y - v1.positionScreen.y ) *
                    ( v2.positionScreen.x - v1.positionScreen.x ) ) < 0;

        };

        var pushLine = function ( a, b ) {

            var v1 = _vertexPool[ a ];
            var v2 = _vertexPool[ b ];

            _line = getNextLineInPool();

            _line.id = object.id;
            _line.v1.copy( v1 );
            _line.v2.copy( v2 );
            _line.z = ( v1.positionScreen.z + v2.positionScreen.z ) / 2;

            _line.material = object.material;

            _renderData.elements.push( _line );

        };

        var pushTriangle = function ( a, b, c ) {

            var v1 = _vertexPool[ a ];
            var v2 = _vertexPool[ b ];
            var v3 = _vertexPool[ c ];

            if ( checkTriangleVisibility( v1, v2, v3 ) === false ) return;

            if ( material.side === THREE.DoubleSide || checkBackfaceCulling( v1, v2, v3 ) === true ) {

                _face = getNextFaceInPool();

                _face.id = object.id;
                _face.v1.copy( v1 );
                _face.v2.copy( v2 );
                _face.v3.copy( v3 );
                _face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;

                for ( var i = 0; i < 3; i ++ ) {

                    var offset = arguments[ i ] * 3;
                    var normal = _face.vertexNormalsModel[ i ];

                    normal.set( normals[ offset ], normals[ offset + 1 ], normals[ offset + 2 ] );
                    normal.applyMatrix3( normalMatrix ).normalize();

                    var offset2 = arguments[ i ] * 2;

                    var uv = _face.uvs[ i ];
                    uv.set( uvs[ offset2 ], uvs[ offset2 + 1 ] );

                }

                _face.vertexNormalsLength = 3;

                _face.material = object.material;

                _renderData.elements.push( _face );

            }

        };

        return {
            setObject: setObject,
            projectVertex: projectVertex,
            checkTriangleVisibility: checkTriangleVisibility,
            checkBackfaceCulling: checkBackfaceCulling,
            pushVertex: pushVertex,
            pushNormal: pushNormal,
            pushUv: pushUv,
            pushLine: pushLine,
            pushTriangle: pushTriangle
        }

    };

    var renderList = new RenderList();

    this.projectScene = function ( scene, camera, sortObjects, sortElements ) {

        _faceCount = 0;
        _lineCount = 0;
        _spriteCount = 0;

        _renderData.elements.length = 0;

        if ( scene.autoUpdate === true ) scene.updateMatrixWorld();
        if ( camera.parent === undefined ) camera.updateMatrixWorld();

        _viewMatrix.copy( camera.matrixWorldInverse.getInverse( camera.matrixWorld ) );
        _viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, _viewMatrix );

        _frustum.setFromMatrix( _viewProjectionMatrix );

        //

        _objectCount = 0;

        _renderData.objects.length = 0;
        _renderData.lights.length = 0;

        scene.traverseVisible( function ( object ) {

            if ( object instanceof THREE.Light ) {

                _renderData.lights.push( object );

            } else if ( object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite ) {

                if ( object.material.visible === false ) return;

                if ( object.frustumCulled === false || _frustum.intersectsObject( object ) === true ) {

                    _object = getNextObjectInPool();
                    _object.id = object.id;
                    _object.object = object;

                    _vector3.setFromMatrixPosition( object.matrixWorld );
                    _vector3.applyProjection( _viewProjectionMatrix );
                    _object.z = _vector3.z;

                    _renderData.objects.push( _object );

                }

            }

        } );

        if ( sortObjects === true ) {

            _renderData.objects.sort( painterSort );

        }

        //

        for ( var o = 0, ol = _renderData.objects.length; o < ol; o ++ ) {

            var object = _renderData.objects[ o ].object;
            var geometry = object.geometry;

            renderList.setObject( object );

            _modelMatrix = object.matrixWorld;

            _vertexCount = 0;

            if ( object instanceof THREE.Mesh ) {

                if ( geometry instanceof THREE.BufferGeometry ) {

                    var attributes = geometry.attributes;
                    var offsets = geometry.offsets;

                    if ( attributes.position === undefined ) continue;

                    var positions = attributes.position.array;

                    for ( var i = 0, l = positions.length; i < l; i += 3 ) {

                        renderList.pushVertex( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

                    }

                    if ( attributes.normal !== undefined ) {

                        var normals = attributes.normal.array;

                        for ( var i = 0, l = normals.length; i < l; i += 3 ) {

                            renderList.pushNormal( normals[ i ], normals[ i + 1 ], normals[ i + 2 ] );

                        }

                    }

                    if ( attributes.uv !== undefined ) {

                        var uvs = attributes.uv.array;

                        for ( var i = 0, l = uvs.length; i < l; i += 2 ) {

                            renderList.pushUv( uvs[ i ], uvs[ i + 1 ] );

                        }

                    }

                    if ( attributes.index !== undefined ) {

                        var indices = attributes.index.array;

                        if ( offsets.length > 0 ) {

                            for ( var o = 0; o < offsets.length; o ++ ) {

                                var offset = offsets[ o ];
                                var index = offset.index;

                                for ( var i = offset.start, l = offset.start + offset.count; i < l; i += 3 ) {

                                    renderList.pushTriangle( indices[ i ] + index, indices[ i + 1 ] + index, indices[ i + 2 ] + index );

                                }

                            }

                        } else {

                            for ( var i = 0, l = indices.length; i < l; i += 3 ) {

                                renderList.pushTriangle( indices[ i ], indices[ i + 1 ], indices[ i + 2 ] );

                            }

                        }

                    } else {

                        for ( var i = 0, l = positions.length / 3; i < l; i += 3 ) {

                            renderList.pushTriangle( i, i + 1, i + 2 );

                        }

                    }

                } else if ( geometry instanceof THREE.Geometry ) {

                    var vertices = geometry.vertices;
                    var faces = geometry.faces;
                    var faceVertexUvs = geometry.faceVertexUvs[ 0 ];

                    _normalMatrix.getNormalMatrix( _modelMatrix );

                    var isFaceMaterial = object.material instanceof THREE.MeshFaceMaterial;
                    var objectMaterials = isFaceMaterial === true ? object.material : null;

                    for ( var v = 0, vl = vertices.length; v < vl; v ++ ) {

                        var vertex = vertices[ v ];
                        renderList.pushVertex( vertex.x, vertex.y, vertex.z );

                    }

                    for ( var f = 0, fl = faces.length; f < fl; f ++ ) {

                        var face = faces[ f ];

                        var material = isFaceMaterial === true
                             ? objectMaterials.materials[ face.materialIndex ]
                             : object.material;

                        if ( material === undefined ) continue;

                        var side = material.side;

                        var v1 = _vertexPool[ face.a ];
                        var v2 = _vertexPool[ face.b ];
                        var v3 = _vertexPool[ face.c ];

                        if ( material.morphTargets === true ) {

                            var morphTargets = geometry.morphTargets;
                            var morphInfluences = object.morphTargetInfluences;

                            var v1p = v1.position;
                            var v2p = v2.position;
                            var v3p = v3.position;

                            _vA.set( 0, 0, 0 );
                            _vB.set( 0, 0, 0 );
                            _vC.set( 0, 0, 0 );

                            for ( var t = 0, tl = morphTargets.length; t < tl; t ++ ) {

                                var influence = morphInfluences[ t ];

                                if ( influence === 0 ) continue;

                                var targets = morphTargets[ t ].vertices;

                                _vA.x += ( targets[ face.a ].x - v1p.x ) * influence;
                                _vA.y += ( targets[ face.a ].y - v1p.y ) * influence;
                                _vA.z += ( targets[ face.a ].z - v1p.z ) * influence;

                                _vB.x += ( targets[ face.b ].x - v2p.x ) * influence;
                                _vB.y += ( targets[ face.b ].y - v2p.y ) * influence;
                                _vB.z += ( targets[ face.b ].z - v2p.z ) * influence;

                                _vC.x += ( targets[ face.c ].x - v3p.x ) * influence;
                                _vC.y += ( targets[ face.c ].y - v3p.y ) * influence;
                                _vC.z += ( targets[ face.c ].z - v3p.z ) * influence;

                            }

                            v1.position.add( _vA );
                            v2.position.add( _vB );
                            v3.position.add( _vC );

                            renderList.projectVertex( v1 );
                            renderList.projectVertex( v2 );
                            renderList.projectVertex( v3 );

                        }

                        if ( renderList.checkTriangleVisibility( v1, v2, v3 ) === false ) continue;

                        var visible = renderList.checkBackfaceCulling( v1, v2, v3 );

                        if ( side !== THREE.DoubleSide ) {
                            if ( side === THREE.FrontSide && visible === false ) continue;
                            if ( side === THREE.BackSide && visible === true ) continue;
                        }

                        _face = getNextFaceInPool();

                        _face.id = object.id;
                        _face.v1.copy( v1 );
                        _face.v2.copy( v2 );
                        _face.v3.copy( v3 );

                        _face.normalModel.copy( face.normal );

                        if ( visible === false && ( side === THREE.BackSide || side === THREE.DoubleSide ) ) {

                            _face.normalModel.negate();

                        }

                        _face.normalModel.applyMatrix3( _normalMatrix ).normalize();

                        var faceVertexNormals = face.vertexNormals;

                        for ( var n = 0, nl = Math.min( faceVertexNormals.length, 3 ); n < nl; n ++ ) {

                            var normalModel = _face.vertexNormalsModel[ n ];
                            normalModel.copy( faceVertexNormals[ n ] );

                            if ( visible === false && ( side === THREE.BackSide || side === THREE.DoubleSide ) ) {

                                normalModel.negate();

                            }

                            normalModel.applyMatrix3( _normalMatrix ).normalize();

                        }

                        _face.vertexNormalsLength = faceVertexNormals.length;

                        var vertexUvs = faceVertexUvs[ f ];

                        if ( vertexUvs !== undefined ) {

                            for ( var u = 0; u < 3; u ++ ) {

                                _face.uvs[ u ].copy( vertexUvs[ u ] );

                            }

                        }

                        _face.color = face.color;
                        _face.material = material;

                        _face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;

                        _renderData.elements.push( _face );

                    }

                }

            } else if ( object instanceof THREE.Line ) {

                if ( geometry instanceof THREE.BufferGeometry ) {

                    var attributes = geometry.attributes;

                    if ( attributes.position !== undefined ) {

                        var positions = attributes.position.array;

                        for ( var i = 0, l = positions.length; i < l; i += 3 ) {

                            renderList.pushVertex( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

                        }

                        if ( attributes.index !== undefined ) {

                            var indices = attributes.index.array;

                            for ( var i = 0, l = indices.length; i < l; i += 2 ) {

                                renderList.pushLine( indices[ i ], indices[ i + 1 ] );

                            }

                        } else {

                            var step = object.mode === THREE.LinePieces ? 2 : 1;

                            for ( var i = 0, l = ( positions.length / 3 ) - 1; i < l; i += step ) {

                                renderList.pushLine( i, i + 1 );

                            }

                        }

                    }

                } else if ( geometry instanceof THREE.Geometry ) {

                    _modelViewProjectionMatrix.multiplyMatrices( _viewProjectionMatrix, _modelMatrix );

                    var vertices = object.geometry.vertices;

                    if ( vertices.length === 0 ) continue;

                    v1 = getNextVertexInPool();
                    v1.positionScreen.copy( vertices[ 0 ] ).applyMatrix4( _modelViewProjectionMatrix );

                    // Handle LineStrip and LinePieces
                    var step = object.mode === THREE.LinePieces ? 2 : 1;

                    for ( var v = 1, vl = vertices.length; v < vl; v ++ ) {

                        v1 = getNextVertexInPool();
                        v1.positionScreen.copy( vertices[ v ] ).applyMatrix4( _modelViewProjectionMatrix );

                        if ( ( v + 1 ) % step > 0 ) continue;

                        v2 = _vertexPool[ _vertexCount - 2 ];

                        _clippedVertex1PositionScreen.copy( v1.positionScreen );
                        _clippedVertex2PositionScreen.copy( v2.positionScreen );

                        if ( clipLine( _clippedVertex1PositionScreen, _clippedVertex2PositionScreen ) === true ) {

                            // Perform the perspective divide
                            _clippedVertex1PositionScreen.multiplyScalar( 1 / _clippedVertex1PositionScreen.w );
                            _clippedVertex2PositionScreen.multiplyScalar( 1 / _clippedVertex2PositionScreen.w );

                            _line = getNextLineInPool();

                            _line.id = object.id;
                            _line.v1.positionScreen.copy( _clippedVertex1PositionScreen );
                            _line.v2.positionScreen.copy( _clippedVertex2PositionScreen );

                            _line.z = Math.max( _clippedVertex1PositionScreen.z, _clippedVertex2PositionScreen.z );

                            _line.material = object.material;

                            if ( object.material.vertexColors === THREE.VertexColors ) {

                                _line.vertexColors[ 0 ].copy( object.geometry.colors[ v ] );
                                _line.vertexColors[ 1 ].copy( object.geometry.colors[ v - 1 ] );

                            }

                            _renderData.elements.push( _line );

                        }

                    }

                }

            } else if ( object instanceof THREE.Sprite ) {

                _vector4.set( _modelMatrix.elements[ 12 ], _modelMatrix.elements[ 13 ], _modelMatrix.elements[ 14 ], 1 );
                _vector4.applyMatrix4( _viewProjectionMatrix );

                var invW = 1 / _vector4.w;

                _vector4.z *= invW;

                if ( _vector4.z >= - 1 && _vector4.z <= 1 ) {

                    _sprite = getNextSpriteInPool();
                    _sprite.id = object.id;
                    _sprite.x = _vector4.x * invW;
                    _sprite.y = _vector4.y * invW;
                    _sprite.z = _vector4.z;
                    _sprite.object = object;

                    _sprite.rotation = object.rotation;

                    _sprite.scale.x = object.scale.x * Math.abs( _sprite.x - ( _vector4.x + camera.projectionMatrix.elements[ 0 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 12 ] ) );
                    _sprite.scale.y = object.scale.y * Math.abs( _sprite.y - ( _vector4.y + camera.projectionMatrix.elements[ 5 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 13 ] ) );

                    _sprite.material = object.material;

                    _renderData.elements.push( _sprite );

                }

            }

        }

        if ( sortElements === true ) {

            _renderData.elements.sort( painterSort );

        }

        return _renderData;

    };

    // Pools

    function getNextObjectInPool() {

        if ( _objectCount === _objectPoolLength ) {

            var object = new THREE.RenderableObject();
            _objectPool.push( object );
            _objectPoolLength ++;
            _objectCount ++;
            return object;

        }

        return _objectPool[ _objectCount ++ ];

    }

    function getNextVertexInPool() {

        if ( _vertexCount === _vertexPoolLength ) {

            var vertex = new THREE.RenderableVertex();
            _vertexPool.push( vertex );
            _vertexPoolLength ++;
            _vertexCount ++;
            return vertex;

        }

        return _vertexPool[ _vertexCount ++ ];

    }

    function getNextFaceInPool() {

        if ( _faceCount === _facePoolLength ) {

            var face = new THREE.RenderableFace();
            _facePool.push( face );
            _facePoolLength ++;
            _faceCount ++;
            return face;

        }

        return _facePool[ _faceCount ++ ];


    }

    function getNextLineInPool() {

        if ( _lineCount === _linePoolLength ) {

            var line = new THREE.RenderableLine();
            _linePool.push( line );
            _linePoolLength ++;
            _lineCount ++
            return line;

        }

        return _linePool[ _lineCount ++ ];

    }

    function getNextSpriteInPool() {

        if ( _spriteCount === _spritePoolLength ) {

            var sprite = new THREE.RenderableSprite();
            _spritePool.push( sprite );
            _spritePoolLength ++;
            _spriteCount ++
            return sprite;

        }

        return _spritePool[ _spriteCount ++ ];

    }

    //

    function painterSort( a, b ) {

        if ( a.z !== b.z ) {

            return b.z - a.z;

        } else if ( a.id !== b.id ) {

            return a.id - b.id;

        } else {

            return 0;

        }

    }

    function clipLine( s1, s2 ) {

        var alpha1 = 0, alpha2 = 1,

        // Calculate the boundary coordinate of each vertex for the near and far clip planes,
        // Z = -1 and Z = +1, respectively.
        bc1near =  s1.z + s1.w,
        bc2near =  s2.z + s2.w,
        bc1far =  - s1.z + s1.w,
        bc2far =  - s2.z + s2.w;

        if ( bc1near >= 0 && bc2near >= 0 && bc1far >= 0 && bc2far >= 0 ) {

            // Both vertices lie entirely within all clip planes.
            return true;

        } else if ( ( bc1near < 0 && bc2near < 0 ) || ( bc1far < 0 && bc2far < 0 ) ) {

            // Both vertices lie entirely outside one of the clip planes.
            return false;

        } else {

            // The line segment spans at least one clip plane.

            if ( bc1near < 0 ) {

                // v1 lies outside the near plane, v2 inside
                alpha1 = Math.max( alpha1, bc1near / ( bc1near - bc2near ) );

            } else if ( bc2near < 0 ) {

                // v2 lies outside the near plane, v1 inside
                alpha2 = Math.min( alpha2, bc1near / ( bc1near - bc2near ) );

            }

            if ( bc1far < 0 ) {

                // v1 lies outside the far plane, v2 inside
                alpha1 = Math.max( alpha1, bc1far / ( bc1far - bc2far ) );

            } else if ( bc2far < 0 ) {

                // v2 lies outside the far plane, v2 inside
                alpha2 = Math.min( alpha2, bc1far / ( bc1far - bc2far ) );

            }

            if ( alpha2 < alpha1 ) {

                // The line segment spans two boundaries, but is outside both of them.
                // (This can't happen when we're only clipping against just near/far but good
                //  to leave the check here for future usage if other clip planes are added.)
                return false;

            } else {

                // Update the s1 and s2 vertices to match the clipped line segment.
                s1.lerp( s2, alpha1 );
                s2.lerp( s1, 1 - alpha2 );

                return true;

            }

        }

    }

};

/*! icn3d.js
 * iCn3D has been developed based on iview (http://istar.cse.cuhk.edu.hk/iview/). The following new features has been added so far.
 * 1. Allowed users to pick atoms, both in perspective and orthographics camera. In order to make this work, the methods of rotation, translation and zooming have been dramatically changed.
 * 2. Allowed users to select residues based on structure, chain, sequence, etc. Userscan also defne their own subset and save the selection.
 * 3. Used standard libraries from three.js for rotation, translation, and zooming.
 * 4. Improved the labeling mechanism.
 * 5. The picking allows users to pick atoms, add labels, choose a new rotation center, etc.
 * 6. Added key operations for rotation, translation, and zooming.
 * 7. Enabled to show nucleotides.
 * 8. Make the tubes shiny.
 * 9. Enabled to save the current state and open the state later.
 *
 * iCn3D used the following standard libraries. We can easily adopt the new versions of these libraries.
 * 1. jquery and jquery ui. Jquery ui is used for show the menu at the top.
 * 2. Recent version of Three.js.
 * 3. surface.js from the iview group in Hongkong for displaying molecular surfaces.
 *
 * Files in #4-9 are combined in one file: full_ui_all.min.js.
 *
 * 4. The rotation, translation operation libraries from Three.js: TrackballControls.js and OrthographicTrackballControls.js.
 * 5. Projector.js from Three.js for the picking.
 * 6. Canvas render library: CanvasRenderer.js. This is used when WebGL render is no working in the browser.
 * 7. A library to detect whether WebGL is working in the browser: Detector.js.
 * 8. The 3D drawing library: icn3d.js
 * 9. Advanced UI library for iCn3D: full_ui.js.
 */

if (typeof jQuery === 'undefined') { throw new Error('iCn3D requires jQuery') }

var iCn3D = function (id) {
    this.REVISION = '1';
    this.id = id;
    this.container = $('#' + id);

    this.overdraw = 0;

    this.bHighlight = 1; // undefined: no highlight, 1: highlight by outline, 2: highlight by 3D object

    if(Detector.webgl){
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container.get(0),
            antialias: true,
            preserveDrawingBuffer: true
        });

        //this.renderer.shadowMapType = THREE.PCFSoftShadowMap; // options are THREE.BasicShadowMap | THREE.PCFShadowMap | THREE.PCFSoftShadowMap

        this.overdraw = 0;
    }
    else {
        //alert("Either your browser or your graphics card does not seem to support WebGL. CanvasRenderer instead of WebGLRenderer is used.");
        alert("Currently your web browser has a problem on WebGL, and CanvasRenderer instead of WebGLRenderer is used. If you are using Chrome, open a new tab for the same URL and WebGL may work again.");

        this.renderer = new THREE.CanvasRenderer({
            canvas: this.container.get(0)
        });

        //http://threejs.org/docs/api/materials/Material.html
        this.overdraw = 0.5;

        // only WebGL support outlines using ShaderMaterial
        this.bHighlight = 2;
    }

    this.matShader = this.setOutlineColor('yellow');
    this.fractionOfColor = new THREE.Color(0.1, 0.1, 0.1);


    // adjust the size
    this.WIDTH = this.container.width(), this.HEIGHT = this.container.height();
    this.setWidthHeight(this.WIDTH, this.HEIGHT);

    this.axis = false;  // used to turn on and off xyz axes

    // picking
    this.picking = 1; // 0: no picking, 1: picking on atoms, 2: picking on residues

    this.pickpair = false; // used for picking pair of atoms for label and distance
    this.pickedatomNum = 0;

    this.pickedatom = undefined;
    this.pickedatom2 = undefined;

    this.bStopRotate = false; // by default, do not stop the possible automatic rotation
    this.bCalphaOnly = false; // by default the input has both Calpha and O, used for drawing strands. If atoms have Calpha only, the orientation of the strands is random
    this.bSSOnly = false; // a flag to turn on when only helix and bricks are available to draw 3D diagram

    this.effects = {
        //'anaglyph': new THREE.AnaglyphEffect(this.renderer),
        //'parallax barrier': new THREE.ParallaxBarrierEffect(this.renderer),
        //'oculus rift': new THREE.OculusRiftEffect(this.renderer),
        //'stereo': new THREE.StereoEffect(this.renderer),
        'none': this.renderer
    };

    this.maxD = 500; // size of the molecule
    //this.camera_z = -150;

    //this.camera_z = this.maxD * 2; // when zooming in, it gets dark if the camera is in front
    this.camera_z = -this.maxD * 2;

    // these variables will not be cleared for each structure
    this.commands = []; // a list of commands, ordered by the operation steps. Each operation will be converted into a command. this command list can be used to go backward and forward.
    this.logs = []; // a list of comands and other logs, ordered by the operation steps.

    this.bRender = true; // a flag to turn off rendering when loading state file

    // Default values
    this.highlightColor = new THREE.Color(0xFFFF00);

    this.sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 32, 1);
    this.cylinderGeometryOutline = new THREE.CylinderGeometry(1, 1, 1, 32, 1, true);
    this.sphereRadius = 1.5;
    this.cylinderRadius = 0.4;
    this.linewidth = 1;
    this.curveWidth = 3;
    this.helixSheetWidth = 1.3;
    this.coilWidth = 0.3;
    this.thickness = 0.4;
    this.axisDIV = 5; // 3
    this.strandDIV = 6;
    this.tubeDIV = 8;

    this.LABELSIZE = 40;

    this.nucleicAcidStrandDIV = 6; //4;
    this.nucleicAcidWidth = 0.8;

    this.options = {
        camera: 'perspective',
        background: 'black',
        color: 'spectrum',
        sidechains: 'nothing',
        secondary: 'cylinder & plate',
        surface: 'Van der Waals surface',
        wireframe: 'no',
        opacity: '0.8',
        ligands: 'stick',
        water: 'nothing',
        ions: 'sphere',
        //labels: 'no',
        //effect: 'none',
        hbonds: 'no',
        labels: 'no',
        lines: 'no',
        rotationcenter: 'molecule center',
        axis: 'no',
        picking: 'no',
        nucleotides: 'nucleotide cartoon',
        showsurface: 'no'
    };

    this._zoomFactor = 1.0;
    this.mouseChange = new THREE.Vector2(0,0);
    this.quaternion = new THREE.Quaternion(0,0,0,1);

    var me = this;
    this.container.bind('contextmenu', function (e) {
        e.preventDefault();
    });

    // key event has to use the document because it requires teh focus
    me.typetext = false;
    $(document).bind('keydown', function (e) {
      if (!me.controls) return;

      me.bStopRotate = true;

      $('input, textarea').focus(function() {
        me.typetext = true;
      });

      $('input, textarea').blur(function() {
        me.typetext = false;
      });

      if(!me.typetext) {
        // zoom
        if(e.keyCode === 90 ) { // Z
          var para = {};

          if(me.camera === me.perspectiveCamera) { // perspective
            para._zoomFactor = 0.9;
          }
          else if(me.camera === me.orthographicCamera) {  // orthographics
            if(me._zoomFactor < 0.1) {
              me._zoomFactor = 0.1;
            }
            else if(me._zoomFactor > 1) {
              me._zoomFactor = 1;
            }

            para._zoomFactor = me._zoomFactor * 0.9;
            if(para._zoomFactor < 0.1) para._zoomFactor = 0.1;
          }

          para.update = true;
          me.controls.update(para);
        }
        else if(e.keyCode === 88 ) { // X
          var para = {};

          if(me.camera === me.perspectiveCamera) { // perspective
            para._zoomFactor = 1.1;
          }
          else if(me.camera === me.orthographicCamera) {  // orthographics
            if(me._zoomFactor > 20) {
              me._zoomFactor = 20;
            }
            else if(me._zoomFactor < 1) {
              me._zoomFactor = 1;
            }

            para._zoomFactor = me._zoomFactor * 1.03;
            if(para._zoomFactor > 20) para._zoomFactor = 20;
          }

          para.update = true;
          me.controls.update(para);
        }

        // rotate
        else if(e.keyCode === 76 ) { // L, rotate left
          var axis = new THREE.Vector3(0,1,0);
          var angle = -5.0 / 180.0 * Math.PI;

          axis.applyQuaternion( me.camera.quaternion ).normalize();

          var quaternion = new THREE.Quaternion();
          quaternion.setFromAxisAngle( axis, -angle );

          var para = {};
          para.quaternion = quaternion;
          para.update = true;

          me.controls.update(para);
        }
        else if(e.keyCode === 74 ) { // J, rotate right
          var axis = new THREE.Vector3(0,1,0);
          var angle = 5.0 / 180.0 * Math.PI;

          axis.applyQuaternion( me.camera.quaternion ).normalize();

          var quaternion = new THREE.Quaternion();
          quaternion.setFromAxisAngle( axis, -angle );

          var para = {};
          para.quaternion = quaternion;
          para.update = true;

          me.controls.update(para);
        }
        else if(e.keyCode === 73 ) { // I, rotate up
          var axis = new THREE.Vector3(1,0,0);
          var angle = -5.0 / 180.0 * Math.PI;

          axis.applyQuaternion( me.camera.quaternion ).normalize();

          var quaternion = new THREE.Quaternion();
          quaternion.setFromAxisAngle( axis, -angle );

          var para = {};
          para.quaternion = quaternion;
          para.update = true;

          me.controls.update(para);
        }
        else if(e.keyCode === 77 ) { // M, rotate down
          var axis = new THREE.Vector3(1,0,0);
          var angle = 5.0 / 180.0 * Math.PI;

          axis.applyQuaternion( me.camera.quaternion ).normalize();

          var quaternion = new THREE.Quaternion();
          quaternion.setFromAxisAngle( axis, -angle );

          var para = {};
          para.quaternion = quaternion;
          para.update = true;

          me.controls.update(para);
        }

        // translate
        else if(e.keyCode === 37 ) { // <-, translate left
          e.preventDefault();
          var mouseChange = new THREE.Vector2(0,0);

          // 1 means the full screen size
          mouseChange.x -= 0.01;

          var para = {};
          para.mouseChange = mouseChange;
          para.update = true;

          me.controls.update(para);
        }
        else if(e.keyCode === 39 ) { // ->, translate right
          e.preventDefault();
          var mouseChange = new THREE.Vector2(0,0);

          mouseChange.x += 0.01;

          var para = {};
          para.mouseChange = mouseChange;
          para.update = true;

          me.controls.update(para);
        }
        else if(e.keyCode === 38 ) { // arrow up, translate up
          e.preventDefault();
          var mouseChange = new THREE.Vector2(0,0);

          mouseChange.y -= 0.01;

          var para = {};
          para.mouseChange = mouseChange;
          para.update = true;

          me.controls.update(para);
        }
        else if(e.keyCode === 40 ) { // arrow down, translate down
          e.preventDefault();
          var mouseChange = new THREE.Vector2(0,0);

          mouseChange.y += 0.01;

          var para = {};
          para.mouseChange = mouseChange;
          para.update = true;

          me.controls.update(para);
        }

        me.render();
      }
    });

    this.container.bind('mouseup touchend', function (e) {
        me.isDragging = false;
    });
    this.container.bind('mousedown touchstart', function (e) {
        e.preventDefault();

        if (!me.scene) return;

        me.bStopRotate = true;

        var x = e.pageX, y = e.pageY;
        if (e.originalEvent.targetTouches && e.originalEvent.targetTouches[0]) {
            x = e.originalEvent.targetTouches[0].pageX;
            y = e.originalEvent.targetTouches[0].pageY;
        }
        me.isDragging = true;

        // see ref http://soledadpenades.com/articles/three-js-tutorials/object-picking/
        if(me.picking) {
            me.mouse.x = ( (x - me.container.offset().left) / me.container.width() ) * 2 - 1;
            me.mouse.y = - ( (y - me.container.offset().top) / me.container.height() ) * 2 + 1;

            var mouse3 = new THREE.Vector3();
            mouse3.x = me.mouse.x;
            mouse3.y = me.mouse.y;
            //mouse3.z = 0.5;
            if(this.camera_z > 0) {
              mouse3.z = -1.0; // between -1 to 1. The z positio of mouse in the real world should be between the camera and the target."-1" worked in our case.
            }
            else {
              mouse3.z = 1.0; // between -1 to 1. The z positio of mouse in the real world should be between the camera and the target."-1" worked in our case.
            }

            // similar to setFromCamera() except mouse3.z is the opposite sign from the value in setFromCamera()
            if(me.camera === me.perspectiveCamera) { // perspective
                if(this.camera_z > 0) {
                  mouse3.z = -1.0;
                }
                else {
                  mouse3.z = 1.0;
                }
                //me.projector.unprojectVector( mouse3, me.camera );  // works for all versions
                mouse3.unproject(me.camera );  // works for all versions
                me.raycaster.set(me.camera.position, mouse3.sub(me.camera.position).normalize()); // works for all versions
            }
            else if(me.camera === me.orthographicCamera) {  // orthographics
                if(this.camera_z > 0) {
                  mouse3.z = 1.0;
                }
                else {
                  mouse3.z = -1.0;
                }
                //me.projector.unprojectVector( mouse3, me.camera );  // works for all versions
                mouse3.unproject(me.camera );  // works for all versions
                me.raycaster.set(mouse3, new THREE.Vector3(0,0,-1).transformDirection( me.camera.matrixWorld )); // works for all versions
            }

            var intersects = me.raycaster.intersectObjects( me.objects ); // not all "mdl" group will be used for picking
            if ( intersects.length > 0 ) {
                // the intersections are sorted so that the closest point is the first one.
                intersects[ 0 ].point.sub(me.mdl.position); // mdl.position was moved to the original (0,0,0) after reading the molecule coordinates. The raycasting was done based on the original. The positio of the ooriginal should be substracted.

                var threshold = 1;
                var atom = me.getAtomsFromPosition(intersects[ 0 ].point, threshold); // the second parameter is the distance threshold. The first matched atom will be returned. Use 1 angstrom, not 2 angstrom. If it's 2 angstrom, other atom will be returned.

                while(!atom && threshold < 10) {
                    ++threshold;
                    atom = me.getAtomsFromPosition(intersects[ 0 ].point, threshold);
                }

                if(atom) {
                    if(me.pickpair) {
                      if(me.pickedatomNum % 2 === 0) {
                        me.pickedatom = atom;
                      }
                      else {
                        me.pickedatom2 = atom;
                      }

                      ++me.pickedatomNum;
                    }
                    else {
                      me.pickedatom = atom;
                    }

                      me.showPicking(atom);
                }
                else {
                    console.log("No atoms were found in 10 andstrom range");
                }
            } // end if
        }

        me.controls.handleResize();
        me.controls.update();
        me.render();
    });
    this.container.bind('mousemove touchmove', function (e) {
        e.preventDefault();
        if (!me.scene) return;
        // no action when no mouse button is clicked and no key was down
        if (!me.isDragging) return;

        me.controls.handleResize();
        me.controls.update();
        me.render();
    });
    this.container.bind('mousewheel', function (e) {
        e.preventDefault();
        if (!me.scene) return;

        me.bStopRotate = true;

//        me.rot.position.z -= e.originalEvent.wheelDelta * 0.025;
        me.controls.handleResize();
        me.controls.update();

        me.render();
    });
    this.container.bind('DOMMouseScroll', function (e) {
        e.preventDefault();
        if (!me.scene) return;

        me.bStopRotate = true;

//        me.rot.position.z += e.originalEvent.detail;
        me.controls.handleResize();
        me.controls.update();

        me.render();
    });
};

iCn3D.prototype = {

    constructor: iCn3D,

    setOutlineColor: function(colorStr) {
        // outline using ShaderMaterial: http://jsfiddle.net/Eskel/g593q/9/
        var shader = {
            'outline' : {
                vertex_shader: [
                    "uniform float offset;",
                    "void main() {",
                        "vec4 pos = modelViewMatrix * vec4( position + normal * offset, 1.0 );",
                        "gl_Position = projectionMatrix * pos;",
                    "}"
                ].join("\n"),

                fragment_shader: [
                    "void main(){",
                        "gl_FragColor = vec4( 1.0, 1.0, 0.0, 1.0 );",
                    "}"
                ].join("\n")
            }
        };

        if(colorStr === 'yellow') {
           shader.outline.fragment_shader = [
               "void main(){",
                   "gl_FragColor = vec4( 1.0, 1.0, 0.0, 1.0 );",
               "}"
           ].join("\n");
        }
        else if(colorStr === 'green') {
           shader.outline.fragment_shader = [
               "void main(){",
                   "gl_FragColor = vec4( 0.0, 1.0, 0.0, 1.0 );",
               "}"
           ].join("\n");
        }
        else if(colorStr === 'red') {
           shader.outline.fragment_shader = [
               "void main(){",
                   "gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );",
               "}"
           ].join("\n");
        }

        // shader
        var uniforms = {offset: {
            type: "f",
            //value: 1
            value: 0.5
          }
        };

        var outShader = shader['outline'];

        var matShader = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: outShader.vertex_shader,
            fragmentShader: outShader.fragment_shader,
            depthTest: false,
            depthWrite: false,
            needsUpdate: true
        });

        return matShader;
    },

    setWidthHeight: function(width, height) {
        this.renderer.setSize(width, height);

        this.container.widthInv  = 1 / width;
        this.container.heightInv = 1 / height;
        this.container.whratio = width / height;
    },

    // added nucleotides and ions
    nucleotidesArray: ['  G', '  A', '  T', '  C', '  U', ' DG', ' DA', ' DT', ' DC', ' DU'],

    ionsArray: [' NA', ' MG', ' AL', ' CA', ' TI', ' MN', ' FE', ' NI', ' CU', ' ZN', ' AG', ' BA', '  F', ' CL', ' BR', '  I'],

    vdwRadii: { // Hu, S.Z.; Zhou, Z.H.; Tsai, K.R. Acta Phys.-Chim. Sin., 2003, 19:1073.
         H: 1.08,
        HE: 1.34,
        LI: 1.75,
        BE: 2.05,
         B: 1.47,
         C: 1.49,
         N: 1.41,
         O: 1.40,
         F: 1.39,
        NE: 1.68,
        NA: 1.84,
        MG: 2.05,
        AL: 2.11,
        SI: 2.07,
         P: 1.92,
         S: 1.82,
        CL: 1.83,
        AR: 1.93,
         K: 2.05,
        CA: 2.21,
        SC: 2.16,
        TI: 1.87,
         V: 1.79,
        CR: 1.89,
        MN: 1.97,
        FE: 1.94,
        CO: 1.92,
        NI: 1.84,
        CU: 1.86,
        ZN: 2.10,
        GA: 2.08,
        GE: 2.15,
        AS: 2.06,
        SE: 1.93,
        BR: 1.98,
        KR: 2.12,
        RB: 2.16,
        SR: 2.24,
         Y: 2.19,
        ZR: 1.86,
        NB: 2.07,
        MO: 2.09,
        TC: 2.09,
        RU: 2.07,
        RH: 1.95,
        PD: 2.02,
        AG: 2.03,
        CD: 2.30,
        IN: 2.36,
        SN: 2.33,
        SB: 2.25,
        TE: 2.23,
         I: 2.23,
        XE: 2.21,
        CS: 2.22,
        BA: 2.51,
        LA: 2.40,
        CE: 2.35,
        PR: 2.39,
        ND: 2.29,
        PM: 2.36,
        SM: 2.29,
        EU: 2.33,
        GD: 2.37,
        TB: 2.21,
        DY: 2.29,
        HO: 2.16,
        ER: 2.35,
        TM: 2.27,
        YB: 2.42,
        LU: 2.21,
        HF: 2.12,
        TA: 2.17,
         W: 2.10,
        RE: 2.17,
        OS: 2.16,
        IR: 2.02,
        PT: 2.09,
        AU: 2.17,
        HG: 2.09,
        TL: 2.35,
        PB: 2.32,
        BI: 2.43,
        PO: 2.29,
        AT: 2.36,
        RN: 2.43,
        FR: 2.56,
        RA: 2.43,
        AC: 2.60,
        TH: 2.37,
        PA: 2.43,
         U: 2.40,
        NP: 2.21,
        PU: 2.56,
        AM: 2.56,
        CM: 2.56,
        BK: 2.56,
        CF: 2.56,
        ES: 2.56,
        FM: 2.56,
    },

    covalentRadii: { // http://en.wikipedia.org/wiki/Covalent_radius
         H: 0.31,
        HE: 0.28,
        LI: 1.28,
        BE: 0.96,
         B: 0.84,
         C: 0.76,
         N: 0.71,
         O: 0.66,
         F: 0.57,
        NE: 0.58,
        NA: 1.66,
        MG: 1.41,
        AL: 1.21,
        SI: 1.11,
         P: 1.07,
         S: 1.05,
        CL: 1.02,
        AR: 1.06,
         K: 2.03,
        CA: 1.76,
        SC: 1.70,
        TI: 1.60,
         V: 1.53,
        CR: 1.39,
        MN: 1.39,
        FE: 1.32,
        CO: 1.26,
        NI: 1.24,
        CU: 1.32,
        ZN: 1.22,
        GA: 1.22,
        GE: 1.20,
        AS: 1.19,
        SE: 1.20,
        BR: 1.20,
        KR: 1.16,
        RB: 2.20,
        SR: 1.95,
         Y: 1.90,
        ZR: 1.75,
        NB: 1.64,
        MO: 1.54,
        TC: 1.47,
        RU: 1.46,
        RH: 1.42,
        PD: 1.39,
        AG: 1.45,
        CD: 1.44,
        IN: 1.42,
        SN: 1.39,
        SB: 1.39,
        TE: 1.38,
         I: 1.39,
        XE: 1.40,
        CS: 2.44,
        BA: 2.15,
        LA: 2.07,
        CE: 2.04,
        PR: 2.03,
        ND: 2.01,
        PM: 1.99,
        SM: 1.98,
        EU: 1.98,
        GD: 1.96,
        TB: 1.94,
        DY: 1.92,
        HO: 1.92,
        ER: 1.89,
        TM: 1.90,
        YB: 1.87,
        LU: 1.87,
        HF: 1.75,
        TA: 1.70,
         W: 1.62,
        RE: 1.51,
        OS: 1.44,
        IR: 1.41,
        PT: 1.36,
        AU: 1.36,
        HG: 1.32,
        TL: 1.45,
        PB: 1.46,
        BI: 1.48,
        PO: 1.40,
        AT: 1.50,
        RN: 1.50,
        FR: 2.60,
        RA: 2.21,
        AC: 2.15,
        TH: 2.06,
        PA: 2.00,
         U: 1.96,
        NP: 1.90,
        PU: 1.87,
        AM: 1.80,
        CM: 1.69,
    },

    //rasmol-like element colors
    atomColors: {
        'H': new THREE.Color(0xFFFFFF),
        'He': new THREE.Color(0xFFC0CB),
        'HE': new THREE.Color(0xFFC0CB),
        'Li': new THREE.Color(0xB22222),
        'LI': new THREE.Color(0xB22222),
        'B': new THREE.Color(0x00FF00),
        'C': new THREE.Color(0xC8C8C8),
        'N': new THREE.Color(0x8F8FFF),
        'O': new THREE.Color(0xF00000),
        'F': new THREE.Color(0xDAA520),
        'Na': new THREE.Color(0x0000FF),
        'NA': new THREE.Color(0x0000FF),
        'Mg': new THREE.Color(0x228B22),
        'MG': new THREE.Color(0x228B22),
        'Al': new THREE.Color(0x808090),
        'AL': new THREE.Color(0x808090),
        'Si': new THREE.Color(0xDAA520),
        'SI': new THREE.Color(0xDAA520),
        'P': new THREE.Color(0xFFA500),
        'S': new THREE.Color(0xFFC832),
        'Cl': new THREE.Color(0x00FF00),
        'CL': new THREE.Color(0x00FF00),
        'Ca': new THREE.Color(0x808090),
        'CA': new THREE.Color(0x808090),
        'Ti': new THREE.Color(0x808090),
        'TI': new THREE.Color(0x808090),
        'Cr': new THREE.Color(0x808090),
        'CR': new THREE.Color(0x808090),
        'Mn': new THREE.Color(0x808090),
        'MN': new THREE.Color(0x808090),
        'Fe': new THREE.Color(0xFFA500),
        'FE': new THREE.Color(0xFFA500),
        'Ni': new THREE.Color(0xA52A2A),
        'NI': new THREE.Color(0xA52A2A),
        'Cu': new THREE.Color(0xA52A2A),
        'CU': new THREE.Color(0xA52A2A),
        'Zn': new THREE.Color(0xA52A2A),
        'ZN': new THREE.Color(0xA52A2A),
        'Br': new THREE.Color(0xA52A2A),
        'BR': new THREE.Color(0xA52A2A),
        'Ag': new THREE.Color(0x808090),
        'AG': new THREE.Color(0x808090),
        'I': new THREE.Color(0xA020F0),
        'Ba': new THREE.Color(0xFFA500),
        'BA': new THREE.Color(0xFFA500),
        'Au': new THREE.Color(0xDAA520),
        'AU': new THREE.Color(0xDAA520)
    },

    defaultAtomColor: new THREE.Color(0xCCCCCC),

    stdChainColors: [
            new THREE.Color(0x32CD32),
            new THREE.Color(0x1E90FF),
            new THREE.Color(0xFA8072),
            new THREE.Color(0xFFA500),
            new THREE.Color(0x00CED1),
            new THREE.Color(0xFF69B4),

            new THREE.Color(0x00FF00),
            new THREE.Color(0x0000FF),
            new THREE.Color(0xFF0000),
            new THREE.Color(0xFFFF00),
            new THREE.Color(0x00FFFF),
            new THREE.Color(0xFF00FF),

            new THREE.Color(0x3CB371),
            new THREE.Color(0x4682B4),
            new THREE.Color(0xCD5C5C),
            new THREE.Color(0xFFE4B5),
            new THREE.Color(0xAFEEEE),
            new THREE.Color(0xEE82EE),

            new THREE.Color(0x006400),
            new THREE.Color(0x00008B),
            new THREE.Color(0x8B0000),
            new THREE.Color(0xCD853F),
            new THREE.Color(0x008B8B),
            new THREE.Color(0x9400D3)
        ],

    backgroundColors: {
        black: new THREE.Color(0x000000),
         grey: new THREE.Color(0xCCCCCC),
        white: new THREE.Color(0xFFFFFF),
    },

    residueColors: {
        ALA: new THREE.Color(0xC8C8C8),
        ARG: new THREE.Color(0x145AFF),
        ASN: new THREE.Color(0x00DCDC),
        ASP: new THREE.Color(0xE60A0A),
        CYS: new THREE.Color(0xE6E600),
        GLN: new THREE.Color(0x00DCDC),
        GLU: new THREE.Color(0xE60A0A),
        GLY: new THREE.Color(0xEBEBEB),
        HIS: new THREE.Color(0x8282D2),
        ILE: new THREE.Color(0x0F820F),
        LEU: new THREE.Color(0x0F820F),
        LYS: new THREE.Color(0x145AFF),
        MET: new THREE.Color(0xE6E600),
        PHE: new THREE.Color(0x3232AA),
        PRO: new THREE.Color(0xDC9682),
        SER: new THREE.Color(0xFA9600),
        THR: new THREE.Color(0xFA9600),
        TRP: new THREE.Color(0xB45AB4),
        TYR: new THREE.Color(0x3232AA),
        VAL: new THREE.Color(0x0F820F),
        ASX: new THREE.Color(0xFF69B4),
        GLX: new THREE.Color(0xFF69B4),
    },

    defaultResidueColor: new THREE.Color(0xBEA06E),

    polarityColors: {
        ARG: new THREE.Color(0xCC0000),
        HIS: new THREE.Color(0xCC0000),
        LYS: new THREE.Color(0xCC0000),
        ASP: new THREE.Color(0xCC0000),
        GLU: new THREE.Color(0xCC0000),
        SER: new THREE.Color(0xCC0000),
        THR: new THREE.Color(0xCC0000),
        ASN: new THREE.Color(0xCC0000),
        GLN: new THREE.Color(0xCC0000),
        TYR: new THREE.Color(0xCC0000),
        GLY: new THREE.Color(0x00CCCC),
        PRO: new THREE.Color(0x00CCCC),
        ALA: new THREE.Color(0x00CCCC),
        VAL: new THREE.Color(0x00CCCC),
        LEU: new THREE.Color(0x00CCCC),
        ILE: new THREE.Color(0x00CCCC),
        MET: new THREE.Color(0x00CCCC),
        PHE: new THREE.Color(0x00CCCC),
        CYS: new THREE.Color(0x00CCCC),
        TRP: new THREE.Color(0x00CCCC),
    },

    ssColors: {
        helix: new THREE.Color(0xFF0080),
        sheet: new THREE.Color(0xFFC800),
         coil: new THREE.Color(0x6080FF),
    },

    defaultBondColor: new THREE.Color(0x2194D6),

    surfaces: {
        1: undefined,
        2: undefined,
        3: undefined,
        4: undefined
    },

    hasCovalentBond: function (atom0, atom1) {
        var r = this.covalentRadii[atom0.elem] + this.covalentRadii[atom1.elem];
        return atom0.coord.distanceToSquared(atom1.coord) < 1.3 * r * r;
    },

    init: function () {
        this.structures = {}; // molecule name -> array of chains
        this.chains = {}; // molecule_chain name -> array of residues
        this.residues = {}; // molecule_chain_resi name -> atom hash
        this.secondarys = {}; // molecule_chain_resi name -> secondary structure: 'C', 'H', or 'E'
        this.alignChains = {}; // molecule_chain name -> atom hash

        this.chainsSeq = {}; // molecule_chain name -> array of sequence
        this.chainsColor = {}; // molecule_chain name -> color, show chain color in sequence display for mmdbid and align input
        this.chainsAnno = {}; // molecule_chain name -> array of array of annotations, such as residue number
        this.chainsAnnoTitle = {}; // molecule_chain name -> array of array of annotation title

        this.alignChainsSeq = {}; // molecule_chain name -> array of residue object: {mmdbid, chain, resi, resn, aligned}
        this.alignChainsAnno = {}; // molecule_chain name -> array of array of annotations, such as residue number
        this.alignChainsAnnoTitle = {}; // molecule_chain name -> array of array of annotation title

        this.displayAtoms = {}; // show selected atoms
        this.highlightAtoms = {}; // used to change color or dislay type for certain atoms

        this.prevHighlightObjects = [];

        this.definedNames2Residues = {}; // custom defined selection name -> residue array
        this.definedNames2Atoms = {}; // custom defined selection name -> atom array
        this.definedNames2Descr = {}; // custom defined selection name -> description
        this.definedNames2Command = {}; // custom defined selection name -> command

        this.residueId2Name = {}; // molecule_chain_resi -> one letter abbreviation

        this.moleculeTitle = "";

        this.atoms = {};
        this.displayAtoms = {};
        this.highlightAtoms = {};
        this.peptides = {};
        this.nucleotides = {};
        this.nucleotidesP = {};
        //this.peptidesnucleotides = {};
        //this.hetatms = {};
        this.ligands = {};
        this.ions = {};
        this.water = {};
        this.calphas = {};

        //this.hbonds = {};
        this.hbondpoints = [];

        this.atomPrevColors = {};

        this.style2atoms = {}; // style -> atom hash, 13 styles: ribbon, strand, cylinder & plate, nucleotide cartoon, phosphorus trace, C alpha trace, B factor tube, lines, stick, ball & stick, sphere, dot, nothing
        this.labels = []; // a list of labels. Each label contains 'position', 'text', 'size', 'color', 'background'
        this.lines = []; // a list of solid or dashed lines. Each line contains 'position1', 'position2', 'color', and a boolean of 'dashed'

        this.inputid = {"idtype": undefined, "id":undefined}; // support pdbid, mmdbid

        this.biomtMatrices = [];
        this.bAssembly = false;
    },

    loadPDB: function (src) {
        var helices = [], sheets = [];
        //this.atoms = {};
        var lines = src.split('\n');

        //var structuresTmp = {}; // serial -> atom
        var chainsTmp = {}; // serial -> atom
        var residuesTmp = {}; // serial -> atom

        this.init();

        //var hbondChainResi = [];
        var sheetArray = [], sheetStart = [], sheetEnd = [], helixArray = [], helixStart = [], helixEnd = [];

        // Concatenation of two pdbs will have several atoms for the same serial
        var serial = 0;

        var moleculeNum = 1;
        var chainNum, residueNum;
        var prevChainNum = '', prevResidueNum = '';
        var prevRecord = '';

        var oriSerial2NewSerial = {};

        for (var i in lines) {
            var line = lines[i];
            var record = line.substr(0, 6);

            if (record === 'HEADER') {
                var name = line.substr(10, 40);
                var id = line.substr(62, 4);

                this.moleculeTitle = name.trim() + " (" + id + ")";

            } else if (record === 'HELIX ') {
                var startChain = line.substr(19, 1);
                var startResi = parseInt(line.substr(21, 4));
                //var endChain = line.substr(31, 1);
                var endResi = parseInt(line.substr(33, 4));

                var chain_resi;
                for(var j = startResi; j <= endResi; ++j) {
                  chain_resi = startChain + "_" + j;
                  helixArray.push(chain_resi);

                  if(j === startResi) helixStart.push(chain_resi);
                  if(j === endResi) helixEnd.push(chain_resi);
                }

                helices.push({
                    chain: startChain,
                    initialResidue: startResi,
                    initialInscode: line.substr(25, 1),
                    terminalResidue: endResi,
                    terminalInscode: line.substr(37, 1),
                });
            } else if (record === 'SHEET ') {
                var startChain = line.substr(21, 1);
                var startResi = parseInt(line.substr(22, 4));
                //var endChain = line.substr(32, 1);
                var endResi = parseInt(line.substr(33, 4));

                for(var j = startResi; j <= endResi; ++j) {
                  var chain_resi = startChain + "_" + j;
                  sheetArray.push(chain_resi);

                  if(j === startResi) sheetStart.push(chain_resi);
                  if(j === endResi) sheetEnd.push(chain_resi);
                }

                sheets.push({
                    chain: startChain,
                    initialResidue: startResi,
                    initialInscode: line.substr(26, 1),
                    terminalResidue: endResi,
                    terminalInscode: line.substr(37, 1),
                });

            } else if (record === 'HBOND ') {
                //HBOND A 1536   N2 A   59  ND2  -19.130  83.151  52.266 -18.079  81.613  49.427    3.40
                bCalculateHbond = false;

                var ligandChain = line.substr(6, 1);
                var ligandResi = line.substr(8, 4).replace(/ /g, "");
                var ligandAtom = line.substr(14, 4).replace(/ /g, "");
                var proteinChain = line.substr(18, 1);
                var proteinResi = line.substr(20, 4).replace(/ /g, "");
                var proteinAtom = line.substr(25, 4).replace(/ /g, "");

                var ligand_x = parseFloat(line.substr(30, 8));
                var ligand_y = parseFloat(line.substr(38, 8));
                var ligand_z = parseFloat(line.substr(46, 8));
                var protein_x = parseFloat(line.substr(54, 8));
                var protein_y = parseFloat(line.substr(62, 8));
                var protein_z = parseFloat(line.substr(70, 8));

                var dist = line.substr(78, 8).replace(/ /g, "");

                this.hbondpoints.push(new THREE.Vector3(ligand_x, ligand_y, ligand_z));
                this.hbondpoints.push(new THREE.Vector3(protein_x, protein_y, protein_z));
            } else if (record === 'REMARK') { // from GLMol
                 var type = parseInt(line.substr(7, 3));
                 if (type == 350 && line.substr(13, 5) == 'BIOMT') {
                    var n = parseInt(line[18]) - 1;
                    var m = parseInt(line.substr(21, 2));
                    if (this.biomtMatrices[m] == undefined) this.biomtMatrices[m] = new THREE.Matrix4().identity();
                    this.biomtMatrices[m].elements[n] = parseFloat(line.substr(24, 9));
                    this.biomtMatrices[m].elements[n + 4] = parseFloat(line.substr(34, 9));
                    this.biomtMatrices[m].elements[n + 8] = parseFloat(line.substr(44, 9));
                    this.biomtMatrices[m].elements[n + 12] = parseFloat(line.substr(54, 10));
                 }
            } else if (record === 'ENDMDL') {
                ++moleculeNum;
            } else if (record === 'JRNL  ') {
                if(line.substr(12, 4) === 'PMID') {
                    this.pmid = line.substr(19).trim();
                }
            } else if (record === 'ATOM  ' || record === 'HETATM') {
                var alt = line.substr(16, 1);
                //if (alt === "B") continue;

                // "CA" has to appear before "O". Otherwise the cartoon of secondary structure will have breaks
                // Concatenation of two pdbs will have several atoms for the same serial
                ++serial;

                var serial2 = parseInt(line.substr(6, 5));
                oriSerial2NewSerial[serial2] = serial;

                var elem = line.substr(76, 2).replace(/ /g, "");
                if (elem === '') { // for some incorrect PDB files
                   elem = line.substr(12, 2).replace(/ /g,"");
                }

                var chain = line.substr(21, 1);
                if(chain === '') chain = 1;

                var resi = parseInt(line.substr(22, 4));
                var atom = line.substr(12, 4).replace(/ /g, '');
                var chain_resi = chain + "_" + resi;

                var x = parseFloat(line.substr(30, 8));
                var y = parseFloat(line.substr(38, 8));
                var z = parseFloat(line.substr(46, 8));
                var resn = line.substr(17, 3);
                var coord = new THREE.Vector3(x, y, z);

                var atomDetails = {
                    het: record[0] === 'H', // optional, used to determine ligands, water, ions, etc
                    serial: serial,         // required, unique atom id
                    name: atom,             // required, atom name
                    alt: alt,               // optional, some alternative coordinates
                    resn: resn,             // optional, used to determine protein or nucleotide
                    structure: moleculeNum,   // optional, used to identify structure
                    chain: chain,           // optional, used to identify chain
                    resi: resi,             // optional, used to identify residue ID
                    //insc: line.substr(26, 1),
                    coord: coord,           // required, used to draw 3D shape
                    b: parseFloat(line.substr(60, 8)), // optional, used to draw B-factor tube
                    elem: elem,             // optional, used to determine hydrogen bond
                    bonds: [],              // required, used to connect atoms
                    ss: 'coil',             // optional, used to show secondary structures
                    ssbegin: false,         // optional, used to show the beginning of secondary structures
                    ssend: false            // optional, used to show the end of secondary structures
                };

                this.atoms[serial] = atomDetails;

                this.displayAtoms[serial] = 1;
                this.highlightAtoms[serial] = 1;

                // Assign secondary structures from the input
                if($.inArray(chain_resi, helixArray) !== -1) {
                  this.atoms[serial].ss = 'helix';

                  if($.inArray(chain_resi, helixStart) !== -1) {
                    this.atoms[serial].ssbegin = true;
                  }

                  // do not use else if. Some residues are both start and end of secondary structure
                  if($.inArray(chain_resi, helixEnd) !== -1) {
                    this.atoms[serial].ssend = true;
                  }
                }
                else if($.inArray(chain_resi, sheetArray) !== -1) {
                  this.atoms[serial].ss = 'sheet';

                  if($.inArray(chain_resi, sheetStart) !== -1) {
                    this.atoms[serial].ssbegin = true;
                  }

                  // do not use else if. Some residues are both start and end of secondary structure
                  if($.inArray(chain_resi, sheetEnd) !== -1) {
                    this.atoms[serial].ssend = true;
                  }
                }

                chainNum = moleculeNum + "_" + chain;
                residueNum = chainNum + "_" + resi;

                var secondarys = '-';
                if(this.atoms[serial].ss === 'helix') {
                    secondarys = 'H';
                }
                else if(this.atoms[serial].ss === 'sheet') {
                    secondarys = 'E';
                }
                else if(!this.atoms[serial].het) {
                    secondarys = 'C';
                }

                this.secondarys[residueNum] = secondarys;

                // different residue
                if(residueNum !== prevResidueNum) {
                    var residue = this.residueName2Abbr(resn);

                    this.residueId2Name[residueNum] = residue;

                    if(serial !== 1) this.residues[prevResidueNum] = residuesTmp;
                    residuesTmp = {};

                    // different chain
                    if(chainNum !== prevChainNum) {
                        // a chain could be separated in two sections
                        if(serial !== 1) this.chains[prevChainNum] = this.unionHash2Atoms(this.chains[prevChainNum], chainsTmp);
                        chainsTmp = {};

                        if(this.structures[moleculeNum.toString()] === undefined) this.structures[moleculeNum.toString()] = [];
                        this.structures[moleculeNum.toString()].push(chainNum);

                        if(this.chainsSeq[chainNum] === undefined) this.chainsSeq[chainNum] = [];
                        if(this.chainsAnno[chainNum] === undefined ) this.chainsAnno[chainNum] = [];
                        if(this.chainsAnno[chainNum][0] === undefined ) this.chainsAnno[chainNum][0] = [];
                        if(this.chainsAnno[chainNum][1] === undefined ) this.chainsAnno[chainNum][1] = [];
                        if(this.chainsAnnoTitle[chainNum] === undefined ) this.chainsAnnoTitle[chainNum] = [];
                        if(this.chainsAnnoTitle[chainNum][0] === undefined ) this.chainsAnnoTitle[chainNum][0] = [];
                        if(this.chainsAnnoTitle[chainNum][1] === undefined ) this.chainsAnnoTitle[chainNum][1] = [];

                          var resObject = {};
                          resObject.resi = resi;
                          resObject.name = residue;

                        this.chainsSeq[chainNum].push(resObject);

                          var numberStr = '';
                          if(resi % 10 === 0) numberStr = resi.toString();

                        this.chainsAnno[chainNum][0].push(numberStr);
                        this.chainsAnno[chainNum][1].push(secondarys);
                        this.chainsAnnoTitle[chainNum][0].push("");
                        this.chainsAnnoTitle[chainNum][1].push("SS");
                    }
                    else {
                          var resObject = {};
                          resObject.resi = resi;
                          resObject.name = residue;

                        this.chainsSeq[chainNum].push(resObject);

                          var numberStr = '';
                          if(resi % 10 === 0) numberStr = resi.toString();

                        this.chainsAnno[chainNum][0].push(numberStr);
                        this.chainsAnno[chainNum][1].push(secondarys);
                    }
                }

                //structuresTmp[serial] = 1;
                chainsTmp[serial] = 1;
                residuesTmp[serial] = 1;

                prevRecord = record;

                prevChainNum = chainNum;
                prevResidueNum = residueNum;

            } else if (record === 'CONECT') {
                var from = parseInt(line.substr(6, 5));
                for (var j = 0; j < 4; ++j) {
                    var to = parseInt(line.substr([11, 16, 21, 26][j], 5));
                    if (isNaN(to)) continue;

                    //this.atoms[from].bonds.push(this.atoms[to].serial);
                    if(this.atoms[oriSerial2NewSerial[from]] !== undefined) this.atoms[oriSerial2NewSerial[from]].bonds.push(oriSerial2NewSerial[to]);
                }
            } else if (record === 'TER   ') {
                // Concatenation of two pdbs will have several atoms for the same serial
                ++serial;

                //this.lastTerSerial = parseInt(line.substr(6, 5));
            }
        }

        // remove the reference
        lines = null;

        // add the last residue set
        var residue = this.residueName2Abbr(resn);

        this.chains[chainNum] = chainsTmp;
        this.residues[residueNum] = residuesTmp;

        var curChain, curResi, curInsc, curResAtoms = [], me = this;
        var refreshBonds = function (f) {
            var n = curResAtoms.length;
            for (var j = 0; j < n; ++j) {
                var atom0 = curResAtoms[j];
                for (var k = j + 1; k < n; ++k) {
                    var atom1 = curResAtoms[k];
                    if (atom0.alt === atom1.alt && me.hasCovalentBond(atom0, atom1)) {
                    //if (me.hasCovalentBond(atom0, atom1)) {
                        atom0.bonds.push(atom1.serial);
                        atom1.bonds.push(atom0.serial);
                    }
                }
                f && f(atom0);
            }
        };
        var pmin = new THREE.Vector3( 9999, 9999, 9999);
        var pmax = new THREE.Vector3(-9999,-9999,-9999);
        var psum = new THREE.Vector3();
        var cnt = 0;
        // assign atoms
        for (var i in this.atoms) {
            var atom = this.atoms[i];
            var coord = atom.coord;
            psum.add(coord);
            pmin.min(coord);
            pmax.max(coord);
            ++cnt;

            if(!atom.het) {
              if($.inArray(atom.resn, this.nucleotidesArray) !== -1) {
                this.nucleotides[atom.serial] = 1;
                if (atom.name === 'P') this.nucleotidesP[atom.serial] = 1;
              }
              else {
                this.peptides[atom.serial] = 1;
                if (atom.name === 'CA') this.calphas[atom.serial] = 1;
              }
            }
            else if(atom.het) {
              if(atom.resn === 'HOH' || atom.resn === 'WAT') {
                this.water[atom.serial] = 1;
              }
              else if($.inArray(atom.resn, this.ionsArray) !== -1) {
                this.ions[atom.serial] = 1;
              }
              else {
                this.ligands[atom.serial] = 1;
              }
            }

            //if (!(curChain === atom.chain && curResi === atom.resi && curInsc === atom.insc)) {
            if (!(curChain === atom.chain && curResi === atom.resi)) {
                refreshBonds(function (atom0) {
                    if (((atom0.name === 'C' && atom.name === 'N') || (atom0.name === 'O3\'' && atom.name === 'P')) && me.hasCovalentBond(atom0, atom)) {
                        atom0.bonds.push(atom.serial);
                        atom.bonds.push(atom0.serial);
                    }
                });
                curChain = atom.chain;
                curResi = atom.resi;
                //curInsc = atom.insc;
                curResAtoms.length = 0;
            }
            curResAtoms.push(atom);
        } // end of for

        refreshBonds();

        this.pmin = pmin;
        this.pmax = pmax;
        //this.psum = psum;

        this.cnt = cnt;

        this.maxD = this.pmax.distanceTo(this.pmin);
        this.center = psum.multiplyScalar(1.0 / this.cnt);

        if (this.maxD < 25) this.maxD = 25;
    },

    cloneHash: function(from, to) {
      for(var i in from) {
        to[i] = from[i];
      }
    },

    residueName2Abbr: function(residueName) {
      if(residueName !== undefined && residueName.charAt(0) !== ' ' && residueName.charAt(1) === ' ') {
        //residueName = 'n' + residueName.charAt(0);
        residueName = residueName.charAt(0);
      }

      switch(residueName) {
        case '  A':
          //return 'nA';
          return 'A';
          break;
        case '  C':
          //return 'nC';
          return 'C';
          break;
        case '  G':
          //return 'nG';
          return 'G';
          break;
        case '  T':
          //return 'nT';
          return 'T';
          break;
        case '  U':
          //return 'nU';
          return 'U';
          break;
        case '  I':
          //return 'nI';
          return 'I';
          break;
        case 'ALA':
          return 'A';
          break;
        case 'ARG':
          return 'R';
          break;
        case 'ASN':
          return 'N';
          break;
        case 'ASP':
          return 'D';
          break;
        case 'CYS':
          return 'C';
          break;
        case 'GLU':
          return 'E';
          break;
        case 'GLN':
          return 'Q';
          break;
        case 'GLY':
          return 'G';
          break;
        case 'HIS':
          return 'H';
          break;
        case 'ILE':
          return 'I';
          break;
        case 'LEU':
          return 'L';
          break;
        case 'LYS':
          return 'K';
          break;
        case 'MET':
          return 'M';
          break;
        case 'PHE':
          return 'F';
          break;
        case 'PRO':
          return 'P';
          break;
        case 'SER':
          return 'S';
          break;
        case 'THR':
          return 'T';
          break;
        case 'TRP':
          return 'W';
          break;
        case 'TYR':
          return 'Y';
          break;
        case 'VAL':
          return 'V';
          break;
        case 'SEC':
          return 'U';
          break;
        case 'PYL':
          return 'O';
          break;

        default:
          return residueName;
      }
    },

    // get hbonds between "molecule" and "ligand"
    calculateLigandHbonds: function (molecule, ligands, threshold) {
        if(Object.keys(molecule).length === 0 || Object.keys(ligands).length === 0) return;

        var atomHbond = {};
        var chain_resi_atom;

        var maxlengthSq = threshold * threshold;

        for (var i in molecule) {
          var atom = molecule[i];

          if(atom.elem === "N" || atom.elem === "O" || atom.elem === "F") { // calculate hydrogen bond
            chain_resi_atom = atom.structure + "_" + atom.chain + "_" + atom.resi + "_" + atom.name;

            atomHbond[chain_resi_atom] = atom;
          }
        } // end of for (var i in molecule) {

        this.highlightAtoms = {};

        for (var i in ligands) {
          var atom = ligands[i];

          if(atom.elem === "N" || atom.elem === "O" || atom.elem === "F") { // calculate hydrogen bond
            chain_resi_atom = atom.structure + "_" + atom.chain + "_" + atom.resi + "_" + atom.name;

            for (var j in atomHbond) {
              var xdiff = Math.abs(atom.coord.x - atomHbond[j].coord.x);
              if(xdiff > threshold) continue;

              var ydiff = Math.abs(atom.coord.y - atomHbond[j].coord.y);
              if(ydiff > threshold) continue;

              var zdiff = Math.abs(atom.coord.z - atomHbond[j].coord.z);
              if(zdiff > threshold) continue;

              var dist = xdiff * xdiff + ydiff * ydiff + zdiff * zdiff;
              if(dist > maxlengthSq) continue;

              // output hydrogen bonds
              var other_chain_resi_atom = j.split('_');

              // remove those hydrogen bonds in the same residue
              //if(parseInt(atom.resi) !== parseInt(other_chain_resi_atom[2])) {
                this.hbondpoints.push(atom.coord);
                this.hbondpoints.push(atomHbond[j].coord);

                for(var k in this.residues[other_chain_resi_atom[0] + "_" + other_chain_resi_atom[1] + "_" + other_chain_resi_atom[2]]) {
                  //if(!this.atoms[i].het) {
                    //this.atoms[i].style = 'sphere';

                    this.highlightAtoms[k] = 1;
                  //}
                }
              //}
            } // end of for (var j in atomHbond) {

            //atomHbond[chain_resi_atom] = atom;
          }
        } // end of for (var i in ligands) {
    },

    createSphere: function (atom, defaultRadius, forceDefault, scale, bHighlight) {
        var mesh;

        if(defaultRadius === undefined) defaultRadius = 0.8;
        if(forceDefault === undefined) forceDefault = false;
        if(scale === undefined) scale = 1.0;

        if(bHighlight === 2) {
          if(scale > 0.9) { // sphere
            scale = 1.5;
          }
          else if(scale < 0.5) { // dot
            scale = 1.0;
            }
          var color = this.highlightColor;

          mesh = new THREE.Mesh(this.sphereGeometry, new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5, metal: false, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));
        }
        else if(bHighlight === 1) {
          mesh = new THREE.Mesh(this.sphereGeometry, this.matShader);
        }
        else {
          var color = atom.color;

          mesh = new THREE.Mesh(this.sphereGeometry, new THREE.MeshPhongMaterial({ metal: false, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));
        }

        mesh.scale.x = mesh.scale.y = mesh.scale.z = forceDefault ? defaultRadius : (this.vdwRadii[atom.elem] || defaultRadius) * (scale ? scale : 1);
        mesh.position.copy(atom.coord);
        this.mdl.add(mesh);
        if(bHighlight === 1 || bHighlight === 2) {
            this.prevHighlightObjects.push(mesh);
        }
        else {
            this.objects.push(mesh);
        }
    },

    // used for highlight
    createBox: function (atom, defaultRadius, forceDefault, scale, color, bHighlight) {
        var mesh;

        if(defaultRadius === undefined) defaultRadius = 0.8;
        if(forceDefault === undefined) forceDefault = false;
        if(scale === undefined) scale = 0.8;

        if(bHighlight) {
            if(color === undefined) color = this.highlightColor;

              mesh = new THREE.Mesh(this.boxGeometry, new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5, metal: false, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));
        }
        else {
            if(color === undefined) color = atom.color;

              mesh = new THREE.Mesh(this.boxGeometry, new THREE.MeshPhongMaterial({ metal: false, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));
        }

        mesh.scale.x = mesh.scale.y = mesh.scale.z = forceDefault ? defaultRadius : (this.vdwRadii[atom.elem] || defaultRadius) * (scale ? scale : 1);
        mesh.position.copy(atom.coord);
        this.mdl.add(mesh);

        if(bHighlight) {
            this.prevHighlightObjects.push(mesh);
        }
        else {
            this.objects.push(mesh);
        }
    },

    createCylinder: function (p0, p1, radius, color, bHighlight) {

        var mesh;

        if(bHighlight === 2) {
          mesh = new THREE.Mesh(this.cylinderGeometry, new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5, metal: false, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));

          radius *= 1.5;
        }
        else if(bHighlight === 1) {
          mesh = new THREE.Mesh(this.cylinderGeometryOutline, this.matShader);
          //mesh = new THREE.Mesh(this.cylinderGeometry, this.matShader);
        }
        else {
          mesh = new THREE.Mesh(this.cylinderGeometry, new THREE.MeshPhongMaterial({ metal: false, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, color: color }));
        }

        mesh.position.copy(p0).add(p1).multiplyScalar(0.5);
        mesh.matrixAutoUpdate = false;
        mesh.lookAt(p0);
        mesh.updateMatrix();

        mesh.matrix.multiply(new THREE.Matrix4().makeScale(radius, radius, p0.distanceTo(p1))).multiply(new THREE.Matrix4().makeRotationX(Math.PI * 0.5));
        this.mdl.add(mesh);
        if(bHighlight === 1 || bHighlight === 2) {
            this.prevHighlightObjects.push(mesh);
        }
        else {
            this.objects.push(mesh);
        }
    },

    createRepresentationSub: function (atoms, f0, f01) {
        var ged = new THREE.Geometry();
        for (var i in atoms) {
            var atom0 = atoms[i];
            f0 && f0(atom0);
            for (var j in atom0.bonds) {
                var atom1 = this.atoms[atom0.bonds[j]];
                if (atom1 === undefined || atom1.serial < atom0.serial) continue;

                f01 && f01(atom0, atom1);
            }
        }
    },

    createSphereRepresentation: function (atoms, defaultRadius, forceDefault, scale, bHighlight) {
        var me = this;
        this.createRepresentationSub(atoms, function (atom0) {
            me.createSphere(atom0, defaultRadius, forceDefault, scale, bHighlight);
        });
    },

    createBoxRepresentation_P_CA: function (atoms, scale, bHighlight) {
        var me = this;
        this.createRepresentationSub(atoms, function (atom0) {
            if(atom0.name === 'CA' || atom0.name === 'P') {
                me.createBox(atom0, undefined, undefined, scale, undefined, bHighlight);
            }
        });
    },

    createStickRepresentation: function (atoms, atomR, bondR, scale, bHighlight) {
        var me = this;

        if(bHighlight !== 2) {
            this.createRepresentationSub(atoms, function (atom0) {
                me.createSphere(atom0, atomR, !scale, scale, bHighlight);
            }, function (atom0, atom1) {
                if (atom0.color === atom1.color) {
                    me.createCylinder(atom0.coord, atom1.coord, bondR, atom0.color, bHighlight);
                } else {
                    var mp = atom0.coord.clone().add(atom1.coord).multiplyScalar(0.5);
                    me.createCylinder(atom0.coord, mp, bondR, atom0.color, bHighlight);
                    me.createCylinder(atom1.coord, mp, bondR, atom1.color, bHighlight);
                }
            });
        }
        else if(bHighlight === 2) {
            this.createBoxRepresentation_P_CA(atoms, 1.2, bHighlight);
        }
    },

    createLineRepresentation: function (atoms, bHighlight) {
        var me = this;
        var geo = new THREE.Geometry();
        this.createRepresentationSub(atoms, undefined, function (atom0, atom1) {
            if (atom0.color === atom1.color) {
                geo.vertices.push(atom0.coord);
                geo.vertices.push(atom1.coord);
                geo.colors.push(atom0.color);
                geo.colors.push(atom1.color);
            } else {
                var mp = atom0.coord.clone().add(atom1.coord).multiplyScalar(0.5);
                geo.vertices.push(atom0.coord);
                geo.vertices.push(mp);
                geo.vertices.push(atom1.coord);
                geo.vertices.push(mp);
                geo.colors.push(atom0.color);
                geo.colors.push(atom0.color);
                geo.colors.push(atom1.color);
                geo.colors.push(atom1.color);
            }
        });

        if(bHighlight !== 2) {
            var line;
            if(bHighlight === 1) {
                // outline didn't work for lines
                //line = new THREE.Mesh(geo, this.matShader);
            }
            else {
                line = new THREE.Line(geo, new THREE.LineBasicMaterial({ linewidth: this.linewidth, vertexColors: true }), THREE.LinePieces);
            }

            this.mdl.add(line);

            if(bHighlight === 1) {
                this.prevHighlightObjects.push(line);
            }
            else {
                this.objects.push(line);
            }
        }
        else if(bHighlight === 2) {
            this.createBoxRepresentation_P_CA(atoms, 0.8, bHighlight);
        }
    },

    subdivide: function (_points, DIV, bShowArray, bHighlight) { // Catmull-Rom subdivision
        var ret = [];

        var points = new Array(); // Smoothing test
        points.push(_points[0]);
        for (var i = 1, lim = _points.length - 1; i < lim; ++i) {
            var p0 = _points[i], p1 = _points[i + 1];
            points.push(p0.smoothen ? p0.clone().add(p1).multiplyScalar(0.5) : p0);
        }
        points.push(_points[_points.length - 1]);

        var savedPoints = [];
        for (var i = -1, size = points.length, DIVINV = 1 / DIV; i <= size - 3; ++i) {
            var p0 = points[i === -1 ? 0 : i];
            var p1 = points[i + 1], p2 = points[i + 2];
            var p3 = points[i === size - 3 ? size - 1 : i + 3];
            var v0 = p2.clone().sub(p0).multiplyScalar(0.5);
            var v1 = p3.clone().sub(p1).multiplyScalar(0.5);

            if(i > -1 && bHighlight && bShowArray !== undefined && bShowArray[i + 1]) {
                // get from previous i for the first half of residue
                ret = ret.concat(savedPoints);
            }

            savedPoints = [];

            for (var j = 0; j < DIV; ++j) {
                var t = DIVINV * j;
                var x = p1.x + t * v0.x
                         + t * t * (-3 * p1.x + 3 * p2.x - 2 * v0.x - v1.x)
                         + t * t * t * (2 * p1.x - 2 * p2.x + v0.x + v1.x);
                var y = p1.y + t * v0.y
                         + t * t * (-3 * p1.y + 3 * p2.y - 2 * v0.y - v1.y)
                         + t * t * t * (2 * p1.y - 2 * p2.y + v0.y + v1.y);
                var z = p1.z + t * v0.z
                         + t * t * (-3 * p1.z + 3 * p2.z - 2 * v0.z - v1.z)
                         + t * t * t * (2 * p1.z - 2 * p2.z + v0.z + v1.z);
                if(!bShowArray) {
                    ret.push(new THREE.Vector3(x, y, z));
                }
                else if(bShowArray[i + 1]) {
                    if(j <= parseInt((DIV + 1) / 2) ) {
                        ret.push(new THREE.Vector3(x, y, z));
                    }
                }
                else if(bShowArray[i + 2]) {
                    if(j >= parseInt((DIV + 1) / 2) ) {
                        savedPoints.push(new THREE.Vector3(x, y, z));
                    }
                }
            }
        }
        if(!bShowArray || bShowArray[i + 1]) {
            if(bHighlight) {
                ret = ret.concat(savedPoints);
            }

            ret.push(points[points.length - 1]);
        }

        return ret;
    },

    createCurveSubArrow: function (p, width, colors, div, bHighlight, bRibbon, num, positionIndex, pointsCA, prevCOArray, bShowArray) {
        var divPoints = [], positions = [];

        divPoints.push(p);
        positions.push(positionIndex);

        this.prepareStrand(divPoints, positions, width, colors, div, undefined, bHighlight, bRibbon, num, pointsCA, prevCOArray, false, bShowArray);
    },

    createCurveSub: function (_points, width, colors, div, bHighlight, bRibbon, bNoSmoothen, bShowArray) {
        if (_points.length === 0) return;
        div = div || 5;
        var points;
        if(!bNoSmoothen) {
            points = this.subdivide(_points, div, bShowArray, bHighlight);
        }
        else {
            points = _points;
        }
        if (points.length === 0) return;

        var geo = new THREE.Geometry();

        if(bHighlight === 2 && bRibbon) {
            for (var i = 0, divInv = 1 / div; i < points.length; ++i) {
                // shift the highlight a little bit to avoid the overlap with ribbon
                points[i].addScalar(0.6); // this.thickness is 0.4
                geo.vertices.push(points[i]);
                geo.colors.push(new THREE.Color(colors[i === 0 ? 0 : Math.round((i - 1) * divInv)]));
            }
        }
        else if(bHighlight === 1) {
            var radius = this.coilWidth / 2;
            var radiusSegments = 32;
            var closed = false;

            if(points.length > 1) {
                var geometry0 = new THREE.TubeGeometry(
                    new THREE.SplineCurve3(points), // path
                    points.length, // segments
                    radius,
                    radiusSegments,
                    closed
                );

                mesh = new THREE.Mesh(geometry0, this.matShader);
                //mesh.material.depthTest = true;
                //mesh.material.depthWrite = false;
                this.mdl.add(mesh);

                this.prevHighlightObjects.push(mesh);
            }
        }
        else {
            for (var i = 0, divInv = 1 / div; i < points.length; ++i) {
                geo.vertices.push(points[i]);
                geo.colors.push(new THREE.Color(colors[i === 0 ? 0 : Math.round((i - 1) * divInv)]));
            }
        }

        var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ linewidth: width, vertexColors: true }), THREE.LineStrip);
        this.mdl.add(line);
        if(bHighlight === 2) {
            this.prevHighlightObjects.push(line);
        }
        else {
            this.objects.push(line);
        }
    },

    createLines: function(lines) { // show extra lines, not used for picking, so no this.objects
       if(lines !== undefined) {
         for(var i in lines) {
           var line = lines[i];

           var p1 = line.position1;
           var p2 = line.position2;

           var colorHex;
           if(line.color) { // #FF0000
              var color = /^\#([0-9a-f]{6})$/i.exec( line.color );
              colorHex = parseInt( color[ 1 ], 16 );
           }
           else {
              colorHex = 0xffff00;
           }

           var dashed = (line.dashed) ? line.dashed : false;
           var dashSize = 0.3;

           this.mdl.add(this.createSingleLine( p1, p2, colorHex, dashed, dashSize ));
         }
       }

       // do not add the artificial lines to raycasting objects
    },

/*
    createCurve: function (atoms, curveWidth, atomName, div) {
        var points = [], colors = [];
        var currentChain, currentResi;
        div = div || 5;
        for (var i in atoms) {
            var atom = atoms[i];
            if (atom.name === atomName && !atom.het) {
                if (currentChain !== atom.chain || currentResi + 1 !== atom.resi) {
                    this.createCurveSub(points, curveWidth, colors, div);
                    points = [];
                    colors = [];
                }
                points.push(atom.coord);
                colors.push(atom.color);
                currentChain = atom.chain;
                currentResi = atom.resi;
            }
        }
        this.createCurveSub(points, curveWidth, colors, div);
    },
*/

    createCylinderCurve: function (atoms, atomName, radius, bLines, bHighlight) {
        var start = null;
        var currentChain, currentResi;
        var i;
        var points = [], colors = [], radii = [];
        for (i in atoms) {
            var atom = atoms[i];
            if (atom.het) continue;
            if (atom.name !== atomName) continue;

            if (start !== null && currentChain === atom.chain && currentResi + 1 === atom.resi) {
                if(!bHighlight) {
                    if(bLines) {
                        var line = this.createSingleLine( start.coord, atom.coord, atom.color, false);
                        this.mdl.add(line);
                        this.objects.push(line);
                    }
                    else {
                        this.createCylinder(start.coord, atom.coord, radius, atom.color);
                        this.createSphere(atom, radius, true, 1);
                    }
                }
                else if(bHighlight === 1) {
                    this.createCylinder(start.coord, atom.coord, radius, atom.color, bHighlight);
                    this.createSphere(atom, radius, true, 1, bHighlight);
                }
            }

            start = atom;
            currentChain = atom.chain;
            currentResi = atom.resi;

            if(bHighlight === 2) this.createBox(atom, undefined, undefined, undefined, undefined, bHighlight);
        }
        if (start !== null && currentChain === atom.chain && currentResi + 1 === atom.resi) {
            if(!bHighlight) {
                if(bLines) {
                    var line = this.createSingleLine( start.coord, atom.coord, atom.color, false);
                    this.mdl.add(line);
                    this.objects.push(line);
                }
                else {
                    this.createCylinder(start.coord, atom.coord, radius, atom.color);
                }
            }
            else if(bHighlight === 1) {
                this.createCylinder(start.coord, atom.coord, radius, atom.color, bHighlight);
                this.createSphere(atom, radius, true, 1, bHighlight);
            }
        }
    },

    prepareStrand: function(divPoints, positions, width, colors, div, thickness, bHighlight, bRibbon, num, pointsCA, prevCOArray, bStrip, bShowArray) {
        if(pointsCA.length === 1) {
            return;
        }

        div = div || this.axisDIV;
        var numM1Inv2 = 2 / (num - 1);
        var delta, lastCAIndex, lastPrevCOIndex, v;

        var points = {}, colorsTmp = [];
        for(var i = 0, il = positions.length; i < il; ++i) points[i] = [];

        // smooth C-alpha
        var pointsCASmooth = this.subdivide(pointsCA, div); // get all smoothen points, do not use 'bShowArray'
        if(pointsCASmooth.length === 1) {
            return;
        }

        // draw the sheet without the last residue
        // use the sheet coord for n-2 residues
        for (var i = 0, il = pointsCA.length - 2; i < il; ++i) {
            for(var index = 0, indexl = positions.length; index < indexl; ++index) {
                points[index].push(divPoints[index][i]);
            }
            colorsTmp.push(colors[i]);
        }
        colorsTmp.push(colors[i]);

        // assign the sheet coord from C-alpha for the 2nd to the last residue of the sheet
        for(var i = 0, il = positions.length; i < il; ++i) {
            delta = -1 + numM1Inv2 * positions[i];
            lastCAIndex = pointsCASmooth.length - 1 - div;
            lastPrevCOIndex = pointsCA.length - 2;
            v = new THREE.Vector3(pointsCASmooth[lastCAIndex].x + prevCOArray[lastPrevCOIndex].x * delta, pointsCASmooth[lastCAIndex].y + prevCOArray[lastPrevCOIndex].y * delta, pointsCASmooth[lastCAIndex].z + prevCOArray[lastPrevCOIndex].z * delta);
            points[i].push(v);
        }

        for(var i = 0, il = positions.length; i < il; ++i) {
            points[i] = this.subdivide(points[i], div, bShowArray, bHighlight);
        }

        if(bStrip) {
            this.createStrip(points[0], points[1], colorsTmp, div, thickness, bHighlight, true);
        }
        else {
            this.createCurveSub(points[0], width, colorsTmp, div, bHighlight, bRibbon, true);
        }

        // draw the arrow
        for(var i = 0, il = positions.length; i < il; ++i) points[i] = [];
        colorsTmp = [];

        for(var index = 0, indexl = positions.length; index < indexl; ++index) {
            for (var i = div * (pointsCA.length - 2), il = div * (pointsCA.length - 1); bShowArray[parseInt(i/div)] && i < il; i = i + div) {
                for (var j = 0; j < div; ++j) {
                    var delta = -1 + numM1Inv2 * positions[index];
                    var scale = 1.8; // scale of the arrow width
                    delta = delta * scale * (div - j) / div;
                    var oriIndex = parseInt(i/div);

                    var v = new THREE.Vector3(pointsCASmooth[i+j].x + prevCOArray[oriIndex].x * delta, pointsCASmooth[i+j].y + prevCOArray[oriIndex].y * delta, pointsCASmooth[i+j].z + prevCOArray[oriIndex].z * delta);
                    v.smoothen = true;
                    points[index].push(v);
                }
            }

            // last residue
            //var delta = -1 + numM1Inv2 * positions[index];
            // make the arrow end with 0
            var delta = 0;
            var lastCAIndex = pointsCASmooth.length - 1;
            var lastPrevCOIndex = pointsCA.length - 1;

            //if(bShowArray[lastPrevCOIndex]) {
                var v = new THREE.Vector3(pointsCASmooth[lastCAIndex].x + prevCOArray[lastPrevCOIndex].x * delta, pointsCASmooth[lastCAIndex].y + prevCOArray[lastPrevCOIndex].y * delta, pointsCASmooth[lastCAIndex].z + prevCOArray[lastPrevCOIndex].z * delta);
                v.smoothen = true;
                points[index].push(v);
            //}
        }

        colorsTmp.push(colors[colors.length - 2]);
        colorsTmp.push(colors[colors.length - 1]);

        if(bStrip) {
            this.createStrip(points[0], points[1], colorsTmp, div, thickness, bHighlight, true);
        }
        else {
            this.createCurveSub(points[0], width, colorsTmp, div, bHighlight, bRibbon, true);
        }
    },

    createStripArrow: function (p0, p1, colors, div, thickness, bHighlight, num, start, end, pointsCA, prevCOArray, bShowArray) {
        var divPoints = [], positions = [];

        divPoints.push(p0);
        divPoints.push(p1);
        positions.push(start);
        positions.push(end);

        this.prepareStrand(divPoints, positions, undefined, colors, div, thickness, bHighlight, undefined, num, pointsCA, prevCOArray, true, bShowArray);
    },

    createStrip: function (p0, p1, colors, div, thickness, bHighlight, bNoSmoothen, bShowArray) {
        if (p0.length < 2) return;
        div = div || this.axisDIV;
        if(!bNoSmoothen) {
            p0 = this.subdivide(p0, div, bShowArray, bHighlight);
            p1 = this.subdivide(p1, div, bShowArray, bHighlight);
        }
        if (p0.length < 2) return;

        var geo = new THREE.Geometry();
        var vs = geo.vertices, fs = geo.faces;
        var axis, p0v, p1v, a0v, a1v;
        for (var i = 0, lim = p0.length; i < lim; ++i) {
            vs.push(p0v = p0[i]); // 0
            vs.push(p0v); // 1
            vs.push(p1v = p1[i]); // 2
            vs.push(p1v); // 3
            if (i < lim - 1) {
                axis = p1[i].clone().sub(p0[i]).cross(p0[i + 1].clone().sub(p0[i])).normalize().multiplyScalar(thickness);
            }
            vs.push(a0v = p0[i].clone().add(axis)); // 4
            vs.push(a0v); // 5
            vs.push(a1v = p1[i].clone().add(axis)); // 6
            vs.push(a1v); // 7
        }
        var faces = [[0, 2, -6, -8], [-4, -2, 6, 4], [7, 3, -5, -1], [-3, -7, 1, 5]];
        for (var i = 1, lim = p0.length, divInv = 1 / div; i < lim; ++i) {
            var offset = 8 * i, color = new THREE.Color(colors[Math.round((i - 1) * divInv)]);
            for (var j = 0; j < 4; ++j) {
                fs.push(new THREE.Face3(offset + faces[j][0], offset + faces[j][1], offset + faces[j][2], undefined, color));
                fs.push(new THREE.Face3(offset + faces[j][3], offset + faces[j][0], offset + faces[j][2], undefined, color));
            }
        }
        var vsize = vs.length - 8; // Cap
        for (var i = 0; i < 4; ++i) {
            vs.push(vs[i * 2]);
            vs.push(vs[vsize + i * 2]);
        };
        vsize += 8;
        fs.push(new THREE.Face3(vsize, vsize + 2, vsize + 6, undefined, fs[0].color));
        fs.push(new THREE.Face3(vsize + 4, vsize, vsize + 6, undefined, fs[0].color));
        fs.push(new THREE.Face3(vsize + 1, vsize + 5, vsize + 7, undefined, fs[fs.length - 3].color));
        fs.push(new THREE.Face3(vsize + 3, vsize + 1, vsize + 7, undefined, fs[fs.length - 3].color));
        geo.computeFaceNormals();
        geo.computeVertexNormals(false);

        var mesh;

        if(bHighlight === 2) {
          mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5, metal: false, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, vertexColors: THREE.FaceColors, side: THREE.DoubleSide }));

          this.mdl.add(mesh);
          this.prevHighlightObjects.push(mesh);
        }
        else if(bHighlight === 1) {
            //mesh = new THREE.Mesh(geo, this.matShader);

            var radius = this.coilWidth / 2;
            var radiusSegments = 32;
            var closed = false;

            // first tube
            var geometry0 = new THREE.TubeGeometry(
                new THREE.SplineCurve3(p0), // path
                p0.length, // segments
                radius,
                radiusSegments,
                closed
            );

            mesh = new THREE.Mesh(geometry0, this.matShader);
            this.mdl.add(mesh);

            this.prevHighlightObjects.push(mesh);

            // second tube
            var geometry1 = new THREE.TubeGeometry(
                new THREE.SplineCurve3(p1), // path
                p1.length, // segments
                radius,
                radiusSegments,
                closed
            );

            mesh = new THREE.Mesh(geometry1, this.matShader);
            this.mdl.add(mesh);

            this.prevHighlightObjects.push(mesh);
        }
        else {
          mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ metal: false, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, vertexColors: THREE.FaceColors, side: THREE.DoubleSide }));

          this.mdl.add(mesh);
          this.objects.push(mesh);
        }
    },

    createBrick: function (brickArray, color) {
        var geo = new THREE.Geometry();

        // https://www.packtpub.com/books/content/working-basic-components-make-threejs-scene
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL
        for (var i = 0, lim = brickArray.length; i < lim; ++i) {
            // brickArray: 000, 001, 010, 011, 100, 101, 110, 111
            geo.vertices.push(new THREE.Vector3(brickArray[i][0], brickArray[i][1], brickArray[i][2]));
        }

        geo.faces = [
            new THREE.Face3(1,5,7, undefined, color),
            new THREE.Face3(1,7,3, undefined, color),
            new THREE.Face3(0,2,6, undefined, color),
            new THREE.Face3(0,6,4, undefined, color),
            new THREE.Face3(2,3,7, undefined, color),
            new THREE.Face3(2,7,6, undefined, color),
            new THREE.Face3(0,4,5, undefined, color),
            new THREE.Face3(0,5,1, undefined, color),
            new THREE.Face3(4,6,7, undefined, color),
            new THREE.Face3(4,7,5, undefined, color),
            new THREE.Face3(0,1,3, undefined, color),
            new THREE.Face3(0,3,2, undefined, color)

        ];

        geo.computeFaceNormals();
        geo.computeVertexNormals(false);

        var mesh;

        mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ metal: false, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, vertexColors: THREE.FaceColors, side: THREE.DoubleSide }));

        this.mdl.add(mesh);
        this.objects.push(mesh);
    },

    getFirstAtomObj: function(atomsHash) {
        var atomKeys = Object.keys(atomsHash);
        var firstIndex = atomKeys[0];

        return this.atoms[firstIndex];
    },

    getLastAtomObj: function(atomsHash) {
        var atomKeys = Object.keys(atomsHash);
        var lastIndex = atomKeys[atomKeys.length - 1];

        return this.atoms[lastIndex];
    },

    createStrand: function (atoms, num, div, fill, coilWidth, helixSheetWidth, doNotSmoothen, thickness, bHighlight) {
        var bRibbon = fill ? true: false;

        // when highlight, the input atoms may only include part of sheet or helix
        // include the whole sheet or helix when highlighting
        var atomsAdjust = {};
        if(bHighlight === 1 || bHighlight === 2) {
            var firstAtom = this.getFirstAtomObj(atoms);
            var lastAtom = this.getLastAtomObj(atoms);

            // fill the beginning
            var beginResi = firstAtom.resi;
            if(firstAtom.ss !== 'coil' && !(firstAtom.ssbegin) ) {
                for(var i = firstAtom.resi - 1; i > 0; --i) {
                    var residueid = firstAtom.structure + '_' + firstAtom.chain + '_' + i;
                    var atom = this.getFirstAtomObj(this.residues[residueid]);

                    if(atom.ss === firstAtom.ss && atom.ssbegin) {
                        beginResi = atom.resi;
                        break;
                    }
                }

                for(var i = beginResi; i < firstAtom.resi; ++i) {
                    var residueid = firstAtom.structure + '_' + firstAtom.chain + '_' + i;
                    atomsAdjust = this.unionHash(atomsAdjust, this.hash2Atoms(this.residues[residueid]));
                }
            }

            // fill the input atoms
            atomsAdjust = this.unionHash(atomsAdjust, atoms);

            // fill the end
            var endResi = lastAtom.resi;
            // when a coil connects to a sheet and the last residue of coild is highlighted, the first sheet residue is set as atom.notshow. This residue should not be shown.
            if(lastAtom.ss !== 'coil' && !(lastAtom.ssend) && !(lastAtom.notshow)) {
                var endChainResi = this.getLastAtomObj(this.chains[lastAtom.structure + '_' + lastAtom.chain]).resi;
                for(var i = lastAtom.resi + 1; i <= endChainResi; ++i) {
                    var residueid = lastAtom.structure + '_' + lastAtom.chain + '_' + i;
                    var atom = this.getFirstAtomObj(this.residues[residueid]);

                    if(atom.ss === lastAtom.ss && atom.ssend) {
                        endResi = atom.resi;
                        break;
                    }
                }

                for(var i = lastAtom.resi + 1; i <= endResi; ++i) {
                    var residueid = lastAtom.structure + '_' + lastAtom.chain + '_' + i;
                    atomsAdjust = this.unionHash(atomsAdjust, this.hash2Atoms(this.residues[residueid]));
                }
            }

            // reset notshow
            if(lastAtom.notshow) lastAtom.notshow = undefined;
        }
        else {
            atomsAdjust = atoms;
        }

        if(bHighlight === 2) {
            //this.createStrand(this.hash2Atoms(atomHash), null, null, null, null, null, false, undefined, bHighlight);
            //this.createStrand(this.hash2Atoms(atomHash), 2, undefined, true, undefined, undefined, false, this.thickness);
            if(fill) {
                fill = false;
                num = null;
                div = null;
                coilWidth = null;
                helixSheetWidth = null;
                thickness = undefined;
            }
            else {
                fill = true;
                num = 2;
                div = undefined;
                coilWidth = undefined;
                helixSheetWidth = undefined;
                thickness = this.thickness;
            }
        }

        num = num || this.strandDIV;
        div = div || this.axisDIV;
        coilWidth = coilWidth || this.coilWidth;
        doNotSmoothen = doNotSmoothen || false;
        helixSheetWidth = helixSheetWidth || this.helixSheetWidth;
        var points = {}; for (var k = 0; k < num; ++k) points[k] = [];
        var pointsCA = [];
        var prevCOArray = [];
        var bShowArray = [];
        var colors = [], colorsArrow = [];
        var currentChain, currentResi, currentCA = null, currentO = null, currentColor = null, prevCoorCA = null, prevCoorO = null, prevColor = null;
        var prevCO = null, ss = null, ssend = false, atomid = null, prevAtomid = null;
        var strandWidth, bSheetSegment = false, bHelixSegment = false;
        var atom, tubeAtoms = {};

        // test the first 30 atoms to see whether only C-alpha is available
        //if(!this.bCalphaOnly) {
          this.bCalphaOnly = false;

          var index = 0, testLength = 30;
          var bOtherAtoms = false;
          for(var i in atoms) {
            if(index < testLength) {
              if(atoms[i].name !== 'CA') {
                bOtherAtoms = true;
                break;
              }
            }
            else {
              break;
            }

            ++index;
          }

          if(!bOtherAtoms) {
            this.bCalphaOnly = true;
          }
        //}

        var atomsObj = this.hash2Atoms(atomsAdjust); // when highlight, draw whole beta sheet and use bShowArray to show the highlight part
        var residueHash = {};
        for(var i in atomsObj) {
            var atom = atomsObj[i];

            residueid = atom.structure + '_' + atom.chain + '_' + atom.resi;
            residueHash[residueid] = 1;
        }
        var totalResidueCount = Object.keys(residueHash).length;

        var drawnResidueCount = 0;
        for (var i in atomsAdjust) {
            atom = atomsAdjust[i];
            var atomOxygen = undefined;
            if ((atom.name === 'O' || atom.name === 'CA') && !atom.het) {
                    // "CA" has to appear before "O"

                    if (atom.name === 'CA') {
                        if ( atoms.hasOwnProperty(i) && (atom.ss === 'coil' || atom.ssend || atom.ssbegin) ) {
                            tubeAtoms[i] = atom;
                        }

                        currentCA = atom.coord.clone();
                        currentColor = atom.color;
                    }

                    if (atom.name === 'O' || (this.bCalphaOnly && atom.name === 'CA')) {
                        if(atom.name === 'O') currentO = atom.coord.clone();

                        // smoothen each coil, helix and sheet separately. The joint residue has to be included both in the previous and next segment
                        var bSameChain = true;
                        if (currentChain !== atom.chain || currentResi + 1 !== atom.resi) {
                            bSameChain = false;
                        }

                        //var bLastResidue = (drawnResidueCount === totalResidueCount - 2) ? true : false;

                        //if((atom.ssend || bLastResidue) && atom.ss === 'sheet') {
                        if(atom.ssend && atom.ss === 'sheet') {
                            bSheetSegment = true;
                        }
                        //else if((atom.ssend || bLastResidue) && atom.ss === 'helix') {
                        else if(atom.ssend && atom.ss === 'helix') {
                            bHelixSegment = true;
                        }

                        // assign the previous residue
                        if(prevCoorO) {
                            if(bHighlight === 1 || bHighlight === 2) {
                                colors.push(this.highlightColor);
                            }
                            else {
                                colors.push(prevColor);
                            }

                            if(ss !== 'coil' && atom.ss === 'coil') {
                                strandWidth = coilWidth;
                            }
                            else if(ssend && atom.ssbegin) { // a transition between two ss
                                strandWidth = coilWidth;
                            }
                            else {
                                strandWidth = (ss === 'coil') ? coilWidth : helixSheetWidth;
                            }

                            //var O = prevCoorO.clone();
                            //O.sub(prevCoorCA);
                            var O;
                            if(atom.name === 'O') {
                                O = prevCoorO.clone();
                                O.sub(prevCoorCA);
                            }
                            else if(this.bCalphaOnly && atom.name === 'CA') {
                                O = new THREE.Vector3(Math.random(),Math.random(),Math.random());
                            }

                            O.normalize(); // can be omitted for performance
                            O.multiplyScalar(strandWidth);
                            //if (prevCO !== undefined && O.dot(prevCO) < 0) O.negate();
                            if (prevCO !== null && O.dot(prevCO) < 0) O.negate();
                            prevCO = O;

                            for (var j = 0, numM1Inv2 = 2 / (num - 1); j < num; ++j) {
                                var delta = -1 + numM1Inv2 * j;
                                var v = new THREE.Vector3(prevCoorCA.x + prevCO.x * delta, prevCoorCA.y + prevCO.y * delta, prevCoorCA.z + prevCO.z * delta);
                                //if (!doNotSmoothen && ss === 'sheet') v.smoothen = true;
                                if (!doNotSmoothen && ss !== 'coil') v.smoothen = true;
                                points[j].push(v);
                            }

                            pointsCA.push(prevCoorCA);
                            prevCOArray.push(prevCO);

                            if(atoms.hasOwnProperty(prevAtomid)) {
                                bShowArray.push(true);
                            }
                            else {
                                bShowArray.push(false);
                            }

                            ++drawnResidueCount;
                        }

                        if ((atom.ssbegin || atom.ssend || (drawnResidueCount === totalResidueCount - 1) ) && points[0].length > 0 && bSameChain) {
                            // assign the current joint residue to the previous segment
                            if(bHighlight === 1 || bHighlight === 2) {
                                colors.push(this.highlightColor);
                            }
                            else {
                                colors.push(atom.color);
                            }

                            if(atom.ssend && atom.ss === 'sheet') { // current residue is the end of ss and is the end of arrow
                                //strandWidth = coilWidth;
                                strandWidth = 0; // make the arrow end sharp
                            }
                            else if(ss === 'coil' && atom.ssbegin) {
                                strandWidth = coilWidth;
                            }
                            else if(ssend && atom.ssbegin) { // current residue is the start of ss and  the previous residue is the end of ss, then use coil
                                strandWidth = coilWidth;
                            }
                            else { // use the ss from the previous residue
                                strandWidth = (atom.ss === 'coil') ? coilWidth : helixSheetWidth;
                            }

                            //var O = currentO.clone();
                            //O.sub(currentCA);

                            var O;
                            if(atom.name === 'O') {
                                O = currentO.clone();
                                O.sub(currentCA);
                            }
                            else if(this.bCalphaOnly && atom.name === 'CA') {
                                O = new THREE.Vector3(Math.random(),Math.random(),Math.random());
                            }

                            O.normalize(); // can be omitted for performance
                            O.multiplyScalar(strandWidth);
                            //if (prevCO !== undefined && O.dot(prevCO) < 0) O.negate();
                            if (prevCO !== null && O.dot(prevCO) < 0) O.negate();
                            prevCO = O;

                            for (var j = 0, numM1Inv2 = 2 / (num - 1); j < num; ++j) {
                                var delta = -1 + numM1Inv2 * j;
                                var v = new THREE.Vector3(currentCA.x + prevCO.x * delta, currentCA.y + prevCO.y * delta, currentCA.z + prevCO.z * delta);
                                if (!doNotSmoothen && ss !== 'coil') v.smoothen = true;
                                points[j].push(v);
                            }

                            atomid = atom.serial;

                            pointsCA.push(currentCA);
                            prevCOArray.push(prevCO);

                            // when a coil connects to a sheet and the last residue of coild is highlighted, the first sheet residue is set as atom.highlightStyle. This residue should not be shown.
                            //if(atoms.hasOwnProperty(atomid) && (bHighlight === 1 && !atom.notshow) ) {
                            if(atoms.hasOwnProperty(atomid)) {
                                bShowArray.push(true);
                            }
                            else {
                                bShowArray.push(false);
                            }

                            //++drawnResidueCount;

                            // draw the current segment
                            for (var j = 0; !fill && j < num; ++j) {
                                if(bSheetSegment) {
                                    this.createCurveSubArrow(points[j], 1, colors, div, bHighlight, bRibbon, num, j, pointsCA, prevCOArray, bShowArray);
                                }
                                else {
                                    this.createCurveSub(points[j], 1, colors, div, bHighlight, bRibbon, false, bShowArray);
                                }
                            }
                            if (fill) {
                                if(bSheetSegment) {
                                    var start = 0, end = num - 1;
                                    this.createStripArrow(points[0], points[num - 1], colors, div, thickness, bHighlight, num, start, end, pointsCA, prevCOArray, bShowArray);
                                }
                                // else {
                                else if(bHelixSegment) {
                                    this.createStrip(points[0], points[num - 1], colors, div, thickness, bHighlight, false, bShowArray);
                                }
                                else {
                                    if(bHighlight === 2) { // draw coils only when highlighted. if not highlighted, coils will be drawn as tubes separately
                                        this.createStrip(points[0], points[num - 1], colors, div, thickness, bHighlight, false, bShowArray);
                                    }
                                }
                            }
                            //var points = {};
                            for (var k = 0; k < num; ++k) points[k] = [];
                            colors = [];
                            pointsCA = [];
                            prevCOArray = [];
                            bShowArray = [];
                            bSheetSegment = false;
                            bHelixSegment = false;
                            //prevCO = null; ss = null; ssend = false;
                            //currentO = null;
                        } // end if (atom.ssbegin || atom.ssend)

                        // end of a chain
                        if ((currentChain !== atom.chain || currentResi + 1 !== atom.resi) && points[0].length > 0) {
                            for (var j = 0; !fill && j < num; ++j) {
                                if(bSheetSegment) {
                                    this.createCurveSubArrow(points[j], 1, colors, div, bHighlight, bRibbon, num, j, pointsCA, prevCOArray, bShowArray);
                                }
                                else if(bHelixSegment) {
                                    this.createCurveSub(points[j], 1, colors, div, bHighlight, bRibbon, false, bShowArray);
                                }
                            }
                            if (fill) {
                                if(bSheetSegment) {
                                    var start = 0, end = num - 1;
                                    this.createStripArrow(points[0], points[num - 1], colors, div, thickness, bHighlight, num, start, end, pointsCA, prevCOArray, bShowArray);
                                }
                                else if(bHelixSegment) {
                                    this.createStrip(points[0], points[num - 1], colors, div, thickness, bHighlight, false, bShowArray);
                                }
                            }

                            //var points = {};
                            for (var k = 0; k < num; ++k) points[k] = [];
                            colors = [];
                            pointsCA = [];
                            prevCOArray = [];
                            bShowArray = [];
                            bSheetSegment = false;
                            bHelixSegment = false;
                            //prevCO = null; ss = null; ssend = false;
                            //currentO = null;
                        }

                        currentChain = atom.chain;
                        currentResi = atom.resi;
                        ss = atom.ss;
                        ssend = atom.ssend;
                        prevAtomid = atom.serial;

                        // only update when atom.name === 'O'
                        prevCoorCA = currentCA;
                        prevCoorO = atom.coord;
                        prevColor = currentColor;
                    } // end if (atom.name === 'O' || (this.bCalphaOnly && atom.name === 'CA') ) {
//                } // end else { // both CA and O
            } // end if ((atom.name === 'O' || atom.name === 'CA') && !atom.het) {
        } // end for

        //if(fill) this.createTube(tubeAtoms, 'CA', 0.3, bHighlight);
        this.createTube(tubeAtoms, 'CA', 0.3, bHighlight);
    },

    createStrandBrick: function (brick, color, thickness) {
        var num = this.strandDIV;
        var div = this.axisDIV;
        var doNotSmoothen = false;
        var helixSheetWidth = this.helixSheetWidth;

        var points = {}; for (var k = 0; k < num; ++k) points[k] = [];
        var colors = [];
        var prevCO = null, ss = null;
        for (var i = 0; i < 2; ++i) {
            var currentCA = brick.coords[i];

            colors.push(new THREE.Color(color));

            var O = new THREE.Vector3(brick.coords[2].x, brick.coords[2].y, brick.coords[2].z);
            O.normalize();

            O.multiplyScalar(helixSheetWidth);
            if (prevCO !== null && O.dot(prevCO) < 0) O.negate();
            prevCO = O;
            for (var j = 0, numM1Inv2 = 2 / (num - 1); j < num; ++j) {
                var delta = -1 + numM1Inv2 * j;
                var v = new THREE.Vector3(currentCA.x + prevCO.x * delta, currentCA.y + prevCO.y * delta, currentCA.z + prevCO.z * delta);
                if (!doNotSmoothen) v.smoothen = true;
                points[j].push(v);
            }
        }
        this.createStrip(points[0], points[num - 1], colors, div, thickness);
    },

    createTubeSub: function (_points, colors, radii, bHighlight) {
        if (_points.length < 2) return;
        var circleDiv = this.tubeDIV, axisDiv = this.axisDIV;
        var circleDivInv = 1 / circleDiv, axisDivInv = 1 / axisDiv;
        var geo = new THREE.Geometry();
        var points = this.subdivide(_points, axisDiv);
        var prevAxis1 = new THREE.Vector3(), prevAxis2;
        for (var i = 0, lim = points.length; i < lim; ++i) {
            var r, idx = (i - 1) * axisDivInv;
            if (i === 0) r = radii[0];
            else {
                if (idx % 1 === 0) r = radii[idx];
                else {
                    var floored = Math.floor(idx);
                    var tmp = idx - floored;
                    r = radii[floored] * tmp + radii[floored + 1] * (1 - tmp);
                }
            }
            var delta, axis1, axis2;
            if (i < lim - 1) {
                delta = points[i].clone().sub(points[i + 1]);
                axis1 = new THREE.Vector3(0, -delta.z, delta.y).normalize().multiplyScalar(r);
                axis2 = delta.clone().cross(axis1).normalize().multiplyScalar(r);
                //      var dir = 1, offset = 0;
                if (prevAxis1.dot(axis1) < 0) {
                    axis1.negate(); axis2.negate();  //dir = -1;//offset = 2 * Math.PI / axisDiv;
                }
                prevAxis1 = axis1; prevAxis2 = axis2;
            } else {
                axis1 = prevAxis1; axis2 = prevAxis2;
            }
            for (var j = 0; j < circleDiv; ++j) {
                var angle = 2 * Math.PI * circleDivInv * j; //* dir  + offset;
                geo.vertices.push(points[i].clone().add(axis1.clone().multiplyScalar(Math.cos(angle))).add(axis2.clone().multiplyScalar(Math.sin(angle))));
            }
        }
        var offset = 0;
        for (var i = 0, lim = points.length - 1; i < lim; ++i) {
            //var c = new THREE.Color(colors[Math.round((i - 1) * axisDivInv)]);
            // For the first residue, use the next residue color; for the lasr residue, use the previous residue color
            var iColor = i;
            if(i < axisDiv) {
                iColor = axisDiv;
            }
            var c = new THREE.Color(colors[parseInt(iColor * axisDivInv)]);

            var reg = 0;
            var r1 = geo.vertices[offset].clone().sub(geo.vertices[offset + circleDiv]).lengthSq();
            var r2 = geo.vertices[offset].clone().sub(geo.vertices[offset + circleDiv + 1]).lengthSq();
            if (r1 > r2) { r1 = r2; reg = 1; };
            for (var j = 0; j < circleDiv; ++j) {
                geo.faces.push(new THREE.Face3(offset + j, offset + (j + reg) % circleDiv + circleDiv, offset + (j + 1) % circleDiv, undefined, c));
                geo.faces.push(new THREE.Face3(offset + (j + 1) % circleDiv, offset + (j + reg) % circleDiv + circleDiv, offset + (j + reg + 1) % circleDiv + circleDiv, undefined, c));
            }
            offset += circleDiv;
        }
        geo.computeFaceNormals();
        geo.computeVertexNormals(false);

        var mesh;
        if(bHighlight === 2) {
          mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.5, metal: false, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, vertexColors: THREE.FaceColors, side: THREE.DoubleSide }));
        }
        else if(bHighlight === 1) {
          mesh = new THREE.Mesh(geo, this.matShader);
          //mesh.material.depthTest = true;
          //mesh.material.depthWrite = false;
          //mesh.quaternion = this.quaternion;
        }
        else {
          mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ metal: false, overdraw: this.overdraw, specular: this.fractionOfColor, shininess: 30, emissive: 0x000000, vertexColors: THREE.FaceColors, side: THREE.DoubleSide }));
        }

        this.mdl.add(mesh);
        if(bHighlight === 1 || bHighlight === 2) {
            this.prevHighlightObjects.push(mesh);
        }
        else {
            this.objects.push(mesh);
        }
    },

    createTube: function (atoms, atomName, radius, bHighlight) {
        var points = [], colors = [], radii = [];
        var currentChain, currentResi;
        for (var i in atoms) {
            var atom = atoms[i];
            if ((atom.name === atomName) && !atom.het) {
                if (currentChain !== atom.chain || currentResi + 1 !== atom.resi) {
                    if(bHighlight !== 2) this.createTubeSub(points, colors, radii, bHighlight);
                    points = []; colors = []; radii = [];
                }
                points.push(atom.coord);

                radii.push(radius || (atom.b > 0 ? atom.b * 0.01 : 0.3));
                colors.push(atom.color);

                currentChain = atom.chain;
                currentResi = atom.resi;

                var scale = 1.2;
                if(bHighlight === 2 && !atom.ssbegin) {
                    this.createBox(atom, undefined, undefined, scale, undefined, bHighlight);
                }
            }
        }
        if(bHighlight !== 2) this.createTubeSub(points, colors, radii, bHighlight);
    },

    createCylinderHelix: function (atoms, radius, bHighlight) {
        var start = null;
        var currentChain, currentResi;
        var others = {}, beta = {};
        var i;
        for (i in atoms) {
            var atom = atoms[i];
            if (atom.het) continue;
            if ((atom.ss !== 'helix' && atom.ss !== 'sheet') || atom.ssend || atom.ssbegin) others[atom.serial] = atom;
            if (atom.ss === 'sheet') beta[atom.serial] = atom;
            if (atom.name !== 'CA') continue;
            if (atom.ss === 'helix' && atom.ssend) {
                if (start !== null && currentChain === atom.chain && currentResi < atom.resi) {
                    if(bHighlight === 1 || bHighlight === 2) {
                        this.createCylinder(start.coord, atom.coord, radius, this.highlightColor, bHighlight);
                    }
                    else {
                        this.createCylinder(start.coord, atom.coord, radius, atom.color);
                    }
                }

                start = null;
            }

            if (start === null && atom.ss === 'helix' && atom.ssbegin) {
                start = atom;

                currentChain = atom.chain;
                currentResi = atom.resi;
            }
        }

        if(bHighlight === 1 || bHighlight === 2) {
            if(Object.keys(others).length > 0) this.createTube(others, 'CA', 0.3, bHighlight);
            if(Object.keys(beta).length > 0) this.createStrand(beta, undefined, undefined, true, 0, this.helixSheetWidth, false, this.thickness * 2, bHighlight);
        }
        else {
            if(Object.keys(others).length > 0) this.createTube(others, 'CA', 0.3);
            if(Object.keys(beta).length > 0) this.createStrand(beta, undefined, undefined, true, 0, this.helixSheetWidth, false, this.thickness * 2);
        }
    },

    createSurfaceRepresentation: function (atoms, type, wireframe, opacity) {
        var geo;

        var ps = ProteinSurface({
            min: this.pmin,
            max: this.pmax,
            atoms: atoms,
            type: type
        });

        var verts = ps.verts;
        var faces = ps.faces;

        geo = new THREE.Geometry();
        geo.vertices = verts.map(function (v) {
            var r = new THREE.Vector3(v.x, v.y, v.z);
            r.atomid = v.atomid;
            return r;
        });
        geo.faces = faces.map(function (f) {
            return new THREE.Face3(f.a, f.b, f.c);
        });

        // remove the reference
        ps = null;

        geo.computeFaceNormals();
        geo.computeVertexNormals(false);

        geo.colorsNeedUpdate = true;
        geo.faces.forEach(function (f) {
            f.vertexColors = ['a', 'b', 'c' ].map(function (d) {
                return atoms[geo.vertices[f[d]].atomid].color;
            });
        });
        var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ overdraw: this.overdraw,
            vertexColors: THREE.VertexColors,
            wireframe: wireframe,
            opacity: opacity,
            transparent: true,
        }));
        this.mdl.add(mesh);
        // do not add surface to raycasting objects for picking
    },

    // nucleotides drawing is from GLMol
    drawNucleicAcidStick: function(atomlist, bHighlight) {
       var currentChain, currentResi, start = null, end = null;
       var i;

       for (i in atomlist) {
          var atom = atomlist[i];
          if (atom === undefined || atom.het) continue;

          if (atom.resi !== currentResi || atom.chain !== currentChain) {
             if (start !== null && end !== null) {
                this.createCylinder(new THREE.Vector3(start.coord.x, start.coord.y, start.coord.z),
                                  new THREE.Vector3(end.coord.x, end.coord.y, end.coord.z), 0.3, start.color, bHighlight);
             }
             start = null; end = null;
          }
          if (atom.name === 'O3\'') start = atom;
          if (atom.resn === '  A' || atom.resn === '  G' || atom.resn === ' DA' || atom.resn === ' DG') {
             if (atom.name === 'N1')  end = atom; //  N1(AG), N3(CTU)
          } else if (atom.name === 'N3') {
             end = atom;
          }
          currentResi = atom.resi; currentChain = atom.chain;
       }
       if (start !== null && end !== null)
          this.createCylinder(new THREE.Vector3(start.coord.x, start.coord.y, start.coord.z),
                            new THREE.Vector3(end.coord.x, end.coord.y, end.coord.z), 0.3, start.color, bHighlight);
    },

    drawCartoonNucleicAcid: function(atomlist, div, thickness, bHighlight) {
       this.drawStrandNucleicAcid(atomlist, 2, div, true, undefined, thickness, bHighlight);
    },

    drawStrandNucleicAcid: function(atomlist, num, div, fill, nucleicAcidWidth, thickness, bHighlight) {
       if(bHighlight === 2) {
           num = undefined;
           thickness = undefined;
       }

       nucleicAcidWidth = nucleicAcidWidth || this.nucleicAcidWidth;
       div = div || this.axisDIV;
       num = num || this.nucleicAcidStrandDIV;
       var i, j, k;
       var points = []; for (k = 0; k < num; k++) points[k] = [];
       var colors = [];
       var currentChain, currentResi, currentO3;
       var prevOO = null;

       for (i in atomlist) {
          var atom = atomlist[i];
          if (atom === undefined) continue;

          if ((atom.name === 'O3\'' || atom.name === 'OP2') && !atom.het) {
             if (atom.name === 'O3\'') { // to connect 3' end. FIXME: better way to do?
                if (currentChain !== atom.chain || currentResi + 1 !== atom.resi) {
                   if (currentO3 && prevOO) {
                      for (j = 0; j < num; j++) {
                         var delta = -1 + 2 / (num - 1) * j;
                         points[j].push(new THREE.Vector3(currentO3.x + prevOO.x * delta,
                          currentO3.y + prevOO.y * delta, currentO3.z + prevOO.z * delta));
                      }
                   }
                   if (fill) this.createStrip(points[0], points[1], colors, div, thickness, bHighlight);
                   for (j = 0; !thickness && j < num; j++)
                      this.createCurveSub(points[j], 1 ,colors, div, bHighlight);
                   var points = []; for (k = 0; k < num; k++) points[k] = [];
                   colors = [];
                   prevOO = null;
                }
                currentO3 = new THREE.Vector3(atom.coord.x, atom.coord.y, atom.coord.z);
                currentChain = atom.chain;
                currentResi = atom.resi;
                if(bHighlight === 1 || bHighlight === 2) {
                    colors.push(this.highlightColor);
                }
                else {
                    colors.push(atom.color);
                }

             } else { // OP2
                if (!currentO3) {prevOO = null; continue;} // for 5' phosphate (e.g. 3QX3)
                var O = new THREE.Vector3(atom.coord.x, atom.coord.y, atom.coord.z);
                O.sub(currentO3);
                O.normalize().multiplyScalar(nucleicAcidWidth);  // TODO: refactor
                //if (prevOO !== undefined && O.dot(prevOO) < 0) {
                if (prevOO !== null && O.dot(prevOO) < 0) {
                   O.negate();
                }
                prevOO = O;
                for (j = 0; j < num; j++) {
                   var delta = -1 + 2 / (num - 1) * j;
                   points[j].push(new THREE.Vector3(currentO3.x + prevOO.x * delta,
                     currentO3.y + prevOO.y * delta, currentO3.z + prevOO.z * delta));
                }
                currentO3 = null;
             }
          }
       }
       if (currentO3 && prevOO) {
          for (j = 0; j < num; j++) {
             var delta = -1 + 2 / (num - 1) * j;
             points[j].push(new THREE.Vector3(currentO3.x + prevOO.x * delta,
               currentO3.y + prevOO.y * delta, currentO3.z + prevOO.z * delta));
          }
       }
       if (fill) this.createStrip(points[0], points[1], colors, div, thickness, bHighlight);
       for (j = 0; !thickness && j < num; j++)
          this.createCurveSub(points[j], 1 ,colors, div, bHighlight);
    },

    drawSymmetryMates2: function() {
       if (this.biomtMatrices === undefined) return;

       var cnt = 1; // itself
       var centerSum = this.center.clone();

       for (var i = 0; i < this.biomtMatrices.length; i++) {  // skip itself
          var mat = this.biomtMatrices[i];
          if (mat === undefined) continue;

          var matArray = mat.toArray();

          // skip itself
          var bItself = 1;
          for(var j in matArray) {
            if(j == 0 || j == 5 || j == 10) {
              if(parseInt(1000*matArray[j]) != 1000) bItself = 0;
            }
            else if(j != 0 && j != 5 && j != 10 && j != 15) {
              if(parseInt(1000*matArray[j]) != 0) bItself = 0;
            }
          }

          if(bItself) continue;

          var symmetryMate = this.mdl.clone();
          symmetryMate.applyMatrix(mat);

          var center = this.center.clone();
          center.applyMatrix4(mat);
          centerSum.add(center);

          this.mdl.add(symmetryMate);

          ++cnt;
       }

       this.maxD *= Math.sqrt(cnt);
       //this.center = centerSum.multiplyScalar(1.0 / cnt);

       this.mdl.position.add(this.center).sub(centerSum.multiplyScalar(1.0 / cnt));

       // reset cameara
       this.setCamera();
    },

    // new: http://stackoverflow.com/questions/23514274/three-js-2d-text-sprite-labels
    // old: http://stemkoski.github.io/Three.js/Sprite-Text-Labels.html
    makeTextSprite: function ( message, parameters ) {
        if ( parameters === undefined ) parameters = {};
        var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Arial";
        var fontsize = parameters.hasOwnProperty("fontsize") ? parameters["fontsize"] : 18;
        var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 4;

        var a = 1.0;
        var borderColor = parameters.hasOwnProperty("borderColor") ? this.hexToRgb(parameters["borderColor"], a) : { r:0, g:0, b:0, a:1.0 };
        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ? this.hexToRgb(parameters["backgroundColor"], a) : { r:0, g:0, b:0, a:0.5 };

        a = 1.0;
        var textColor = parameters.hasOwnProperty("textColor") ? this.hexToRgb(parameters["textColor"], a) : { r:255, g:255, b:0, a:1.0 };

        var canvas = document.createElement('canvas');

        var context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;

        var metrics = context.measureText( message );
        var textWidth = metrics.width;

        var radius = context.measureText( "M" ).width;

        // background color
        context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
        // border color
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";

        context.lineWidth = borderThickness;
        this.roundRect(context, borderThickness/2, borderThickness/2, (textWidth + borderThickness) * 1.1, fontsize*1.4 + borderThickness, radius * 0.3);
        // 1.4 is extra height factor for text below baseline: g,j,p,q.

        context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
        context.strokeStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";

        context.fillText( message, borderThickness + fontsize*0.1, fontsize + borderThickness);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas)
        texture.needsUpdate = true;

        var frontOfTarget = true;
        //var spriteMaterial = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false } );
        var spriteMaterial = new THREE.SpriteMaterial( {
            map: texture,
            useScreenCoordinates: false,
            depthTest: !frontOfTarget,
            depthWrite: !frontOfTarget
        } );

        var sprite = new THREE.Sprite( spriteMaterial );
        //sprite.scale.set(4, 2, 1.0);
        //sprite.scale.set(1, 1, 1);

        var factor = this.maxD / 100;

        sprite.scale.set(16*factor, 8*factor, 1.0);

        return sprite;
    },

    // http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    hexToRgb: function (hex, a) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: a
        } : null;
    },

    // function for drawing rounded rectangles
    roundRect: function (ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.lineTo(x+w-r, y);
        ctx.quadraticCurveTo(x+w, y, x+w, y+r);
        ctx.lineTo(x+w, y+h-r);
        ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
        ctx.lineTo(x+r, y+h);
        ctx.quadraticCurveTo(x, y+h, x, y+h-r);
        ctx.lineTo(x, y+r);
        ctx.quadraticCurveTo(x, y, x+r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },

    createLabelRepresentation: function (labels) {
        for (var i in labels) {
            var label = labels[i];
            // make sure fontsize is a number

            var labelsize = (label.size) ? label.size : this.LABELSIZE;
            var labelcolor = (label.color) ? label.color : '#ffff00';
            var labelbackground = (label.background) ? label.background : '#cccccc';

            var bb = this.makeTextSprite(label.text, {fontsize: parseInt(labelsize), textColor: labelcolor, borderColor: labelbackground, backgroundColor: labelbackground});

            //bb.position.copy(labelpositions[i]);
            bb.position.set(label.position.x, label.position.y, label.position.z);
            this.mdl.add(bb);
            // do not add labels to objects for picking
        }
    },

    getAtomsWithinAtom: function(atomlist, atomlistTarget, distance) {
       var i;

       var extent = this.getExtent(atomlistTarget);

       var targetRadiusSq1 = (extent[2][0] - extent[0][0]) * (extent[2][0] - extent[0][0]) + (extent[2][1] - extent[0][1]) * (extent[2][1] - extent[0][1]) + (extent[2][2] - extent[0][2]) * (extent[2][2] - extent[0][2]);
       var targetRadiusSq2 = (extent[2][0] - extent[1][0]) * (extent[2][0] - extent[1][0]) + (extent[2][1] - extent[1][1]) * (extent[2][1] - extent[1][1]) + (extent[2][2] - extent[1][2]) * (extent[2][2] - extent[1][2]);
       var targetRadiusSq = (targetRadiusSq1 > targetRadiusSq2) ? targetRadiusSq1 : targetRadiusSq2;
       var targetRadius = Math.sqrt(targetRadiusSq);

       var maxDistSq = (targetRadius + distance) * (targetRadius + distance);

       var ret = {};
       for (i in atomlist) {
          var atom = atomlist[i];

          if (atom.coord.x < extent[0][0] - distance || atom.coord.x > extent[1][0] + distance) continue;
          if (atom.coord.y < extent[0][1] - distance || atom.coord.y > extent[1][1] + distance) continue;
          if (atom.coord.z < extent[0][2] - distance || atom.coord.z > extent[1][2] + distance) continue;

          // exclude the target atoms
          if(atom.serial in atomlistTarget) continue;

          // only show protein or DNA/RNA
          //if(atom.serial in this.peptides || atom.serial in this.nucleotides) {
              var atomDistSq = (atom.coord.x - extent[2][0]) * (atom.coord.x - extent[2][0]) + (atom.coord.y - extent[2][1]) * (atom.coord.y - extent[2][1]) + (atom.coord.z - extent[2][2]) * (atom.coord.z - extent[2][2]);

              if(atomDistSq < maxDistSq) {
                  ret[atom.serial] = atom;
              }
          //}
       }

       return ret;
    },

    getExtent: function(atomlist) {
       var xmin = ymin = zmin = 9999;
       var xmax = ymax = zmax = -9999;
       var xsum = ysum = zsum = cnt = 0;
       var i;
       for (i in atomlist) {
          var atom = atomlist[i];
          cnt++;
          xsum += atom.coord.x; ysum += atom.coord.y; zsum += atom.coord.z;


          xmin = (xmin < atom.coord.x) ? xmin : atom.coord.x;

          ymin = (ymin < atom.coord.y) ? ymin : atom.coord.y;
          zmin = (zmin < atom.coord.z) ? zmin : atom.coord.z;
          xmax = (xmax > atom.coord.x) ? xmax : atom.coord.x;
          ymax = (ymax > atom.coord.y) ? ymax : atom.coord.y;
          zmax = (zmax > atom.coord.z) ? zmax : atom.coord.z;
       }

       return [[xmin, ymin, zmin], [xmax, ymax, zmax], [xsum / cnt, ysum / cnt, zsum / cnt]];
    },

    getAtomsFromPosition: function(point, threshold) {
       var i, atom;

       if(threshold === undefined || threshold === null) {
         threshold = 1;
       }

       for (i in this.atoms) {
          var atom = this.atoms[i];

          if(atom.coord.x < point.x - threshold || atom.coord.x > point.x + threshold) continue;
          if(atom.coord.y < point.y - threshold || atom.coord.y > point.y + threshold) continue;
          if(atom.coord.z < point.z - threshold || atom.coord.z > point.z + threshold) continue;

          return atom;
       }

       return null;
    },

    // http://soledadpenades.com/articles/three-js-tutorials/drawing-the-coordinate-axes/
    buildAxes: function (radius) {
        var axes = new THREE.Object3D();

        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0 + radius, 0, 0 ), 0xFF0000, false, 0.5 ) ); // +X
        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0 - radius, 0, 0 ), 0x800000, true, 0.5) ); // -X

        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0 + radius, 0 ), 0x00FF00, false, 0.5 ) ); // +Y
        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0 - radius, 0 ), 0x008000, true, 0.5 ) ); // -Y

        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 + radius ), 0x0000FF, false, 0.5 ) ); // +Z
        axes.add( this.createSingleLine( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0 - radius ), 0x000080, true, 0.5 ) ); // -Z

        //return axes;
        this.scene.add( axes );

    },

    createSingleLine: function ( src, dst, colorHex, dashed, dashSize ) {
        var geom = new THREE.Geometry();
        var mat;

        if(dashed) {
            mat = new THREE.LineDashedMaterial({ linewidth: 1, color: colorHex, dashSize: dashSize, gapSize: dashSize });
        } else {
            mat = new THREE.LineBasicMaterial({ linewidth: 1, color: colorHex });
        }

        geom.vertices.push( src );
        geom.vertices.push( dst );
        if(dashed) geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

        var axis = new THREE.Line( geom, mat, THREE.LinePieces );

        return axis;
    },

    intersectHash: function(atoms1, atoms2) {
        var results = {};

        if(Object.keys(atoms1).length < Object.keys(atoms2).length) {
            for (var i in atoms1) {
                if (atoms2 !== undefined && atoms2[i]) {
                    results[i] = atoms1[i];
                }
            }
        }
        else {
            for (var i in atoms2) {
                if (atoms1 !== undefined && atoms1[i]) {
                    results[i] = atoms2[i];
                }
            }
        }

        return results;
    },

    // get atoms in allAtoms, but not in "atoms"
    excludeHash: function(includeAtoms, excludeAtoms) {
        var results = {};

        for (var i in includeAtoms) {
            if (!(i in excludeAtoms)) {
                results[i] = includeAtoms[i];
            }
        }

        return results;
    },

    unionHash: function(atoms1, atoms2) {
        return jQuery.extend({}, atoms1, atoms2);
    },

    intersectHash2Atoms: function(atoms1, atoms2) {
        return this.hash2Atoms(this.intersectHash(atoms1, atoms2));
    },

    // get atoms in allAtoms, but not in "atoms"
    excludeHash2Atoms: function(includeAtoms, excludeAtoms) {
        return this.hash2Atoms(this.excludeHash(includeAtoms, excludeAtoms));
    },

    unionHash2Atoms: function(atoms1, atoms2) {
        return this.hash2Atoms(this.unionHash(atoms1, atoms2));
    },

    hash2Atoms: function(hash) {
        var atoms = {};
        for(var i in hash) {
          atoms[i] = this.atoms[i];
        }

        return atoms;
    },

    centerAtoms: function(atoms) {
        var pmin = new THREE.Vector3( 9999, 9999, 9999);
        var pmax = new THREE.Vector3(-9999,-9999,-9999);
        var psum = new THREE.Vector3();
        var cnt = 0;

        for (var i in atoms) {
            var atom = this.atoms[i];
            var coord = atom.coord;
            psum.add(coord);
            pmin.min(coord);
            pmax.max(coord);
            ++cnt;
        }

        var maxD = pmax.distanceTo(pmin);

        return {"center": psum.multiplyScalar(1.0 / cnt), "maxD": maxD};
    },

    exportCanvas: function () {
        this.render();
        window.open(this.renderer.domElement.toDataURL('image/png'));
    },

    applyPrevColor: function () {
        for (var i in this.atoms) {
            var atom = this.atoms[i];
            atom.color = this.atomPrevColors[i];
        }
    },

    setColorByOptions: function (options, atoms, bUseInputColor) {
      if(bUseInputColor !== undefined && bUseInputColor) {
        for (var i in atoms) {
            var atom = this.atoms[i];

            this.atomPrevColors[i] = atom.color;
        }
      }
      else if(options.color.indexOf("#") === 0) {
        for (var i in atoms) {
            var atom = this.atoms[i];
            atom.color = new THREE.Color().setStyle(options.color.toLowerCase());

            this.atomPrevColors[i] = atom.color;
        }
      }
      else {
        switch (options.color.toLowerCase()) {
            case 'spectrum':
                var idx = 0;
                //var lastTerSerialInv = 1 / this.lastTerSerial;
                var lastTerSerialInv = 1 / this.cnt;
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = atom.het ? this.atomColors[atom.elem] || this.defaultAtomColor : new THREE.Color().setHSL(2 / 3 * (1 - idx++ * lastTerSerialInv), 1, 0.45);
                    //atom.color = this.atomColors[atom.elem] || this.defaultAtomColor;

                    this.atomPrevColors[i] = atom.color;
                }
                break;
            case 'chain':
                var index = -1, prevChain = '', colorLength = this.stdChainColors.length;
                for (var i in atoms) {
                    var atom = this.atoms[i];

                    if(atom.chain != prevChain) {
                        ++index;

                        index = index % colorLength;
                    }

                    atom.color = this.stdChainColors[index];

                    if(Object.keys(this.chainsColor).length > 0) this.updateChainsColor(atom);
                    this.atomPrevColors[i] = atom.color;

                    prevChain = atom.chain;
                }
                break;
            case 'secondary structure':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = atom.het ? this.atomColors[atom.elem] || this.defaultAtomColor : this.ssColors[atom.ss];

                    this.atomPrevColors[i] = atom.color;
                }

                break;
            case 'B factor':
                var firstAtom = this.getFirstAtomObj(this.atoms);
                if (!this.middB && firstAtom.b !== undefined) {
                    var minB = 1000, maxB = -1000;
                    for (var i in atoms) {
                        var atom = this.atoms[i];
                        if (minB > parseFloat(atom.b)) minB = parseFloat(atom.b);
                        if (maxB < parseFloat(atom.b)) maxB = parseFloat(atom.b);
                    }
                    this.middB = (maxB + minB) * 0.5;
                    this.spanB = (maxB - minB) * 0.5;
                    this.spanBinv = 1 / this.spanB;
                }
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    if(atom.b !== undefined && this.middB !== undefined) {
                        atom.color = atom.b < this.middB ? new THREE.Color().setRGB(1 - (s = (this.middB - atom.b) * this.spanBinv), 1 - s, 1) : new THREE.Color().setRGB(1, 1 - (s = (atom.b - this.middB) * this.spanBinv), 1 - s);
                    }

                    this.atomPrevColors[i] = atom.color;
                }
                break;
            case 'residue':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = atom.het ? this.atomColors[atom.elem] || this.defaultAtomColor : this.residueColors[atom.resn] || this.defaultResidueColor;

                    this.atomPrevColors[i] = atom.color;
                }
                break;
            case 'polarity':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = atom.het ? this.atomColors[atom.elem] || this.defaultAtomColor : this.polarityColors[atom.resn] || this.defaultResidueColor;

                    this.atomPrevColors[i] = atom.color;
                }
                break;
            case 'atom':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = this.atomColors[atom.elem] || this.defaultAtomColor;

                    this.atomPrevColors[i] = atom.color;
                }
                break;

            case 'white':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = new THREE.Color().setHex(0xFFFFFF);

                    if(Object.keys(this.chainsColor).length > 0) this.updateChainsColor(atom);
                    this.atomPrevColors[i] = atom.color;
                }
                break;

            case 'grey':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = new THREE.Color().setHex(0x888888);

                    if(Object.keys(this.chainsColor).length > 0) this.updateChainsColor(atom);
                    this.atomPrevColors[i] = atom.color;
                }
                break;


            case 'red':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = new THREE.Color().setHex(0xFF0000);

                    if(Object.keys(this.chainsColor).length > 0) this.updateChainsColor(atom);
                    this.atomPrevColors[i] = atom.color;
                }
                break;
            case 'green':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = new THREE.Color().setHex(0x00FF00);

                    if(Object.keys(this.chainsColor).length > 0) this.updateChainsColor(atom);
                    this.atomPrevColors[i] = atom.color;
                }
                break;
            case 'blue':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = new THREE.Color().setHex(0x0000FF);

                    if(Object.keys(this.chainsColor).length > 0) this.updateChainsColor(atom);
                    this.atomPrevColors[i] = atom.color;
                }
                break;
            case 'magenta':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = new THREE.Color().setHex(0xFF00FF);

                    if(Object.keys(this.chainsColor).length > 0) this.updateChainsColor(atom);
                    this.atomPrevColors[i] = atom.color;
                }
                break;
            case 'yellow':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = new THREE.Color().setHex(0xFFFF00);

                    if(Object.keys(this.chainsColor).length > 0) this.updateChainsColor(atom);
                    this.atomPrevColors[i] = atom.color;
                }
                break;
            case 'cyan':
                for (var i in atoms) {
                    var atom = this.atoms[i];
                    atom.color = new THREE.Color().setHex(0x00FFFF);

                    if(Object.keys(this.chainsColor).length > 0) this.updateChainsColor(atom);
                    this.atomPrevColors[i] = atom.color;
                }
                break;
            case 'custom':
                // do the coloring separately
                break;
        }
      }
    },

    updateChainsColor: function (atom) {
        var chainid = atom.structure + '_' + atom.chain;
        if(this.chainsColor[chainid] !== undefined) {  // for mmdbid and align input
            this.chainsColor[chainid] = atom.color;
        }
    },

    applyOptions: function (options) {
        if(options === undefined) options = this.options;

        this.applyDisplayOptions(options, this.displayAtoms);

        //common part options
        if (options.labels.toLowerCase() === 'yes') {
            this.createLabelRepresentation(this.labels);
        }

        if (options.lines.toLowerCase() === 'yes') {
            this.createLines(this.lines);
        }

        if (options.hbonds.toLowerCase() === 'yes') {
            var color = '#FFFFFF';
            if(options.background.toLowerCase() !== "black") {
              color = '#000000';
            }

             for (var i = 0, lim = Math.floor(this.hbondpoints.length / 2); i < lim; i++) {
                var p1 = this.hbondpoints[2 * i], p2 = this.hbondpoints[2 * i + 1];

                var line = {};
                line.position1 = this.hbondpoints[2 * i];
                line.position2 = this.hbondpoints[2 * i + 1];
                line.color = color;
                line.dashed = true;

                this.lines.push(line);
             }

            this.createLines(this.lines);
        }

        switch (options.rotationcenter.toLowerCase()) {
            case 'molecule center':
                // move the molecule to the origin
                if(this.center !== undefined) this.mdl.position.sub(this.center);
                break;
            case 'pick center':
                if(this.pickedatom !== undefined) {
                  this.mdl.position.sub(this.pickedatom.coord);
                }
                break;
            case 'display center':
                var center = this.centerAtoms(this.displayAtoms).center;
                this.mdl.position.sub(center);
                break;
            case 'highlight center':
                var center = this.centerAtoms(this.highlightAtoms).center;
                this.mdl.position.sub(center);
                break;
        }
        switch (options.axis.toLowerCase()) {
            case 'yes':
                this.axis = true;

                this.buildAxes(this.maxD/2);

                break;
            case 'no':
                this.axis = false;
                break;
        }
        switch (options.picking.toLowerCase()) {
            case 'atom':
                this.picking = 1;
                //this.showpicking = 'yes';
                break;
            case 'no':
                this.picking = 0;
                break;
            case 'residue':
                this.picking = 2;
                break;
        }
    },

    drawHelixBrick: function(molid2ss, molid2color) {
        for(var molid in molid2ss) {
          for(var j = 0, jl = molid2ss[molid].length; j < jl; ++j) {
            if(molid2ss[molid][j].type === 'helix') {
              var radius = 1.6;
              var color = new THREE.Color(molid2color[molid]);

              var p0 = new THREE.Vector3(molid2ss[molid][j].coords[0].x, molid2ss[molid][j].coords[0].y, molid2ss[molid][j].coords[0].z);
              var p1 = new THREE.Vector3(molid2ss[molid][j].coords[1].x, molid2ss[molid][j].coords[1].y, molid2ss[molid][j].coords[1].z);

              this.createCylinder(p0, p1, radius, color);
            }

            else if(molid2ss[molid][j].type === 'brick') {
              // the original bricks are very thin
              //var brickArray = molid2ss[molid][j].bricks;

              //var color = new THREE.Color(molid2color[molid]);
              //this.createBrick(brickArray, color);

              // create strands with any width and thickness
              var brick = molid2ss[molid][j];
              var color = molid2color[molid];
              this.createStrandBrick(brick, color, this.thickness);
            }
            else if(molid2ss[molid][j].type === 'coil') {
                 var points = [], colors = [], radii = [];

                 var p0 = new THREE.Vector3(molid2ss[molid][j].coords[0].x, molid2ss[molid][j].coords[0].y, molid2ss[molid][j].coords[0].z);
                 var p1 = new THREE.Vector3(molid2ss[molid][j].coords[1].x, molid2ss[molid][j].coords[1].y, molid2ss[molid][j].coords[1].z);

                 var color = new THREE.Color(molid2color[molid]);

                 var line = this.createSingleLine( p0, p1, color, false);
                 this.mdl.add(line);
                 this.objects.push(line);
            }
          } // inner for
        } // outer for
    },

    applyDisplayOptions: function (options, atoms, bHighlight) { // atoms: hash of key -> 1
        if(options === undefined) options = this.options;

        var residueHash = {};
        var singletonResidueHash = {};
        var atomsObj = {};
        var residueid;
        //if(bHighlight === 1 || bHighlight === 2) {
        if(bHighlight === 1) {
            atomsObj = this.hash2Atoms(atoms);

            for(var i in atomsObj) {
                var atom = atomsObj[i];

                residueid = atom.structure + '_' + atom.chain + '_' + atom.resi;
                residueHash[residueid] = 1;
            }

            // find singleton residues
            for(var i in residueHash) {
                var last = i.lastIndexOf('_');
                var base = i.substr(0, last + 1);
                var lastResi = parseInt(i.substr(last + 1));

                var prevResidueid = base + (lastResi - 1).toString();
                var nextResidueid = base + (lastResi + 1).toString();

                if(!residueHash.hasOwnProperty(prevResidueid) && !residueHash.hasOwnProperty(prevResidueid)) {
                    singletonResidueHash[i] = 1;
                }
            }

            // show the only atom in a transparent box
            if(Object.keys(atomsObj).length === 1 && Object.keys(this.residues[residueid]).length > 1
                  && atomsObj[Object.keys(atomsObj)[0]].style !== 'sphere' && atomsObj[Object.keys(atomsObj)[0]].style !== 'dot') {
                if(this.bCid === undefined || !this.bCid) {
                    for(var i in atomsObj) {
                        var atom = atomsObj[i];
                        var scale = 1.0;
                        this.createBox(atom, undefined, undefined, scale, undefined, bHighlight);
                    }
                }
            }
            else {
                // if only one residue, add the next residue in order to show highlight
                for(var residueid in singletonResidueHash) {
                    var atom = this.getFirstAtomObj(this.residues[residueid]);
                    var prevResidueid = atom.structure + '_' + atom.chain + '_' + parseInt(atom.resi - 1);
                    var nextResidueid = atom.structure + '_' + atom.chain + '_' + parseInt(atom.resi + 1);

                    //ribbon, strand, cylinder & plate, nucleotide cartoon, phosphorus trace, C alpha trace, B factor tube, lines, stick, ball & stick, sphere, dot

                    if(atom.style === 'cylinder & plate' && atom.ss === 'helix') { // no way to highlight part of cylinder
                        for(var i in this.residues[residueid]) {
                            var atom = this.atoms[i];
                            var scale = 1.0;
                            this.createBox(atom, undefined, undefined, scale, undefined, bHighlight);
                        }
                    }
                    else if( (atom.style === 'ribbon' && atom.ss === 'coil') || (atom.style === 'strand' && atom.ss === 'coil') || atom.style === 'phosphorus trace' || atom.style === 'C alpha trace' || atom.style === 'B factor tube' || (atom.style === 'cylinder & plate' && atom.ss !== 'helix') ) {
                        var bAddResidue = false;
                        // add the next residue with same style
                        if(!bAddResidue && this.residues.hasOwnProperty(nextResidueid)) {
                            var index2 = Object.keys(this.residues[nextResidueid])[0];
                            var atom2 = this.hash2Atoms(this.residues[nextResidueid])[index2];
                            if( (atom.style === atom2.style && !atom2.ssbegin) || atom2.ssbegin) {
                                var residueAtoms = this.residues[nextResidueid];
                                atoms = this.unionHash(atoms, residueAtoms);

                                bAddResidue = true;

                                // record the highlight style for the artificial residue
                                if(atom2.ssbegin) {
                                    for(var i in residueAtoms) {
                                        this.atoms[i].notshow = true;
                                    }
                                }
                            }
                        }

                        // add the previous residue with same style
                        if(!bAddResidue && this.residues.hasOwnProperty(prevResidueid)) {
                            var index2 = Object.keys(this.residues[prevResidueid])[0];
                            var atom2 = this.hash2Atoms(this.residues[prevResidueid])[index2];
                            if(atom.style === atom2.style) {
                                atoms = this.unionHash(atoms, this.residues[prevResidueid]);

                                bAddResidue = true;
                            }
                        }
                    }
                    else if( (atom.style === 'ribbon' && atom.ss !== 'coil' && atom.ssend) || (atom.style === 'strand' && atom.ss !== 'coil' && atom.ssend)) {
                        var bAddResidue = false;
                        // add the next residue with same style
                        if(!bAddResidue && this.residues.hasOwnProperty(nextResidueid)) {
                            var index2 = Object.keys(this.residues[nextResidueid])[0];
                            var atom2 = this.hash2Atoms(this.residues[nextResidueid])[index2];
                            //if(atom.style === atom2.style && !atom2.ssbegin) {
                                atoms = this.unionHash(atoms, this.residues[nextResidueid]);

                                bAddResidue = true;
                            //}
                        }
                    }
                } // end for
            } // end else {
        } // end if(bHighlight === 1)

        this.setStyle2Atoms(atoms);

        for(var style in this.style2atoms) {
          // 13 styles: ribbon, strand, cylinder & plate, nucleotide cartoon, phosphorus trace, C alpha trace, B factor tube, lines, stick, ball & stick, sphere, dot, nothing
          atomHash = this.style2atoms[style];

          if(style === 'ribbon') {
              this.createStrand(this.hash2Atoms(atomHash), 2, undefined, true, undefined, undefined, false, this.thickness, bHighlight);
          }
          else if(style === 'strand') {
              this.createStrand(this.hash2Atoms(atomHash), null, null, null, null, null, false, undefined, bHighlight);
          }
          else if(style === 'cylinder & plate') {
            this.createCylinderHelix(this.hash2Atoms(atomHash), 1.6, bHighlight);
          }
          else if(style === 'nucleotide cartoon') {
            this.drawCartoonNucleicAcid(this.hash2Atoms(atomHash), null, this.thickness, bHighlight);

            if(bHighlight !== 2) this.drawNucleicAcidStick(this.hash2Atoms(atomHash), bHighlight);
          }
          else if(style === 'phosphorus trace') {
            this.createCylinderCurve(this.hash2Atoms(atomHash), 'P', 0.2, false, bHighlight);
          }
          else if(style === 'phosphorus lines') {
            this.createCylinderCurve(this.hash2Atoms(atomHash), 'P', 0.2, true, bHighlight);
          }
          else if(style === 'C alpha trace') {
            this.createCylinderCurve(this.hash2Atoms(atomHash), 'CA', 0.2, false, bHighlight);
          }
          else if(style === 'B factor tube') {
            this.createTube(this.hash2Atoms(atomHash), 'CA', null, bHighlight);
          }
          else if(style === 'lines') {
            if(bHighlight === 1) {
                this.createStickRepresentation(this.hash2Atoms(atomHash), 0.1, 0.1, undefined, bHighlight);
            }
            else {
                this.createLineRepresentation(this.hash2Atoms(atomHash), bHighlight);
            }
          }
          else if(style === 'stick') {
            this.createStickRepresentation(this.hash2Atoms(atomHash), this.cylinderRadius, this.cylinderRadius, undefined, bHighlight);
          }
          else if(style === 'ball & stick') {
            this.createStickRepresentation(this.hash2Atoms(atomHash), this.cylinderRadius, this.cylinderRadius * 0.5, 0.3, bHighlight);
          }
          else if(style === 'sphere') {
            this.createSphereRepresentation(this.hash2Atoms(atomHash), this.sphereRadius, undefined, undefined, bHighlight);
          }
          else if(style === 'dot') {
            this.createSphereRepresentation(this.hash2Atoms(atomHash), this.sphereRadius, false, 0.3, bHighlight);
          }

          // do not show highlight if structure is not shown
          /*
          else { // structure not shown, show the highlight
            if(bHighlight === 2) bHighlight === 1;

            if(bHighlight === 1) {
                var atoms = this.hash2Atoms(atomHash);
                var nonHetAtoms = {};
                for(var i in atoms) {
                    var atom = atoms[i];
                    if(atom.het) {
                        var scale = 1.0;
                        this.createBox(atom, undefined, undefined, scale, undefined, bHighlight);
                    }
                    else {
                        nonHetAtoms[i] = atom;
                    }
                }

                if(Object.keys(nonHetAtoms).length > 0) {
                    this.createStrand(nonHetAtoms, null, null, null, null, null, false, undefined, bHighlight);
                }
            }
          }
          */
        } // end for loop

        //switch (options.wireframe.toLowerCase()) {
        switch (options.wireframe) {
            case 'yes':
                options.wireframe = true;
                break;
            case 'no':
                options.wireframe = false;
                break;
        }

        options.opacity = parseFloat(options.opacity);

        if(options.showsurface.toLowerCase() === 'yes') {
          var currAtoms = {};

          currAtoms = this.hash2Atoms(this.highlightAtoms);

          switch (options.surface.toLowerCase()) {
              case 'van der waals surface':
                  this.createSurfaceRepresentation(currAtoms, 1, options.wireframe, options.opacity);
                  break;
              case 'solvent excluded surface':
                  this.createSurfaceRepresentation(currAtoms, 2, options.wireframe, options.opacity);
                  break;
              case 'solvent accessible surface':
                  this.createSurfaceRepresentation(currAtoms, 3, options.wireframe, options.opacity);
                  break;
              case 'molecular surface':
                  this.createSurfaceRepresentation(currAtoms, 4, options.wireframe, options.opacity);
                  break;
          }
        }

        //this.renderer.autoClear = options.effect !== 'oculus rift' && options.effect !== 'stereo';
        //this.effect = this.effects[options.effect];
        //this.effect.setSize(this.container.width(), this.container.height());
    },

    setStyle2Atoms: function (atoms) {
          this.style2atoms = {};

          for(var i in atoms) {
            if(this.style2atoms[this.atoms[i].style] === undefined) this.style2atoms[this.atoms[i].style] = {};

            this.style2atoms[this.atoms[i].style][i] = 1;
          }
    },

    // set atom style when loading a structure
    setAtomStyleByOptions: function (options) {
        if (options.sidechains !== undefined) {
            for(var i in this.peptides) {
              this.atoms[i].style = options.sidechains.toLowerCase();
            }
        }

        if (options.secondary !== undefined) {
            for(var i in this.peptides) {
              this.atoms[i].style = options.secondary.toLowerCase();
            }
        }

        if (options.ligands !== undefined) {
            for(var i in this.ligands) {
              this.atoms[i].style = options.ligands.toLowerCase();
            }
        }

        if (options.ions !== undefined) {
            for(var i in this.ions) {
              this.atoms[i].style = options.ions.toLowerCase();
            }
        }

        if (options.water !== undefined) {
            for(var i in this.water) {
              this.atoms[i].style = options.water.toLowerCase();
            }
        }

        if (options.nucleotides !== undefined) {
            for(var i in this.nucleotides) {
              this.atoms[i].style = options.nucleotides.toLowerCase();
            }
        }
    },

    rebuildScene: function (options) {
        jQuery.extend(this.options, options);

        this.scene = new THREE.Scene();

        this.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);

        //this.directionalLight.shadowMapWidth = 2048; // default is 512
        //this.directionalLight.shadowMapHeight = 2048; // default is 512

        if(this.camera_z > 0) {
          this.directionalLight.position.set(0, 0, 1);
        }
        else {
          this.directionalLight.position.set(0, 0, -1);
        }

        var ambientLight = new THREE.AmbientLight(0x202020);

        this.scene.add(this.directionalLight);
        this.scene.add(ambientLight);

        this.mdl = new THREE.Object3D();
        this.scene.add(this.mdl);

        // related to picking
        this.objects = []; // define objects for picking, not all elements are used for picking
        this.raycaster = new THREE.Raycaster();
        this.projector = new THREE.Projector();
        this.mouse = new THREE.Vector2();

        //this.mdl = new THREE.Object3D();
        //this.scene.add(this.mdl);

        var background = this.backgroundColors[this.options.background.toLowerCase()];
        this.renderer.setClearColor(background);
//        this.scene.fog = new THREE.Fog(background, 100, 200);

        this.perspectiveCamera = new THREE.PerspectiveCamera(20, this.container.whratio, 0.1, 10000);
        this.perspectiveCamera.position.set(0, 0, this.camera_z);
        this.perspectiveCamera.lookAt(new THREE.Vector3(0, 0, 0));

        this.orthographicCamera = new THREE.OrthographicCamera();
        this.orthographicCamera.position.set(0, 0, this.camera_z);
        this.orthographicCamera.lookAt(new THREE.Vector3(0, 0, 0));

        this.cameras = {
            perspective: this.perspectiveCamera,
            orthographic: this.orthographicCamera,
        };

        this.setCamera();

//        if (this.camera === this.perspectiveCamera){
//            this.scene.fog.near = this.camera.near + 0.4 * (this.camera.far - this.camera.near);
//            if (this.scene.fog.near > center) this.scene.fog.near = center;
//            this.scene.fog.far = this.camera.far;
//        }

        this.applyOptions( this.options );
    },

    setCamera: function() {
        this.camera = this.cameras[this.options.camera.toLowerCase()];

        if(this.camera === this.perspectiveCamera) {
            if(this.camera_z > 0) {
              this.camera.position.z = this.maxD * 2; // forperspective, the z positionshould be large enough to see the whole molecule
            }
            else {
              this.camera.position.z = -this.maxD * 2; // forperspective, the z positionshould be large enough to see the whole molecule
            }

            this.controls = new THREE.TrackballControls( this.camera, document.getElementById(this.id), this );
        }
        else if (this.camera === this.orthographicCamera){
            //this.camera.right = this.maxD/2 * 1.2;
            this.camera.right = this.maxD/2 * 2.5;
            this.camera.left = -this.camera.right;
            this.camera.top = this.camera.right /this.container.whratio;
            this.camera.bottom = -this.camera.right /this.container.whratio;

            if(this.camera_z > 0) {
              this.camera.near = 10000;
              this.camera.far = -10000;
            }
            else {
              this.camera.near = -10000;
              this.camera.far = 10000;
            }

            this.controls = new THREE.OrthographicTrackballControls( this.camera, document.getElementById(this.id), this );
        }

        this.camera.updateProjectionMatrix();
    },

    applyTransformation: function (_zoomFactor, mouseChange, quaternion) {
        var para = {};
        para.update = false;

        // zoom
        para._zoomFactor = _zoomFactor;

        // translate
        para.mouseChange = new THREE.Vector2();
        para.mouseChange.copy(mouseChange);

        // rotation
        para.quaternion = new THREE.Quaternion();
        para.quaternion.copy(quaternion);

        this.controls.update(para);
    },

    render: function () {
        //this.directionalLight.position.copy(this.camera.position).normalize();
        this.directionalLight.position.copy(this.camera.position);

        //this.effect.render(this.scene, this.camera);
        this.renderer.gammaInput = true
        this.renderer.gammaOutput = true

        this.renderer.setPixelRatio( window.devicePixelRatio ); // r71
        this.renderer.render(this.scene, this.camera);
    },

    setRotationCenter: function (coord) {
        this.mdl.position.sub(coord);
    },

    draw: function (options, bPrevColor) {
        this.rebuildScene(options);

        if(bPrevColor === undefined || bPrevColor) this.applyPrevColor();

        if(this.bSSOnly) this.drawHelixBrick(this.molid2ss, this.molid2color);

        if(this.bAssembly) this.drawSymmetryMates2();

        // show the highlightAtoms
        if(this.highlightAtoms !== undefined && Object.keys(this.highlightAtoms).length > 0 && Object.keys(this.highlightAtoms).length < Object.keys(this.displayAtoms).length) {
            this.removeHighlightObjects();
            this.addHighlightObjects(undefined, undefined);
        }

        if(this.bRender === true) {
          this.applyTransformation(this._zoomFactor, this.mouseChange, this.quaternion);
          this.render();
        }
    },


    // zoom
    zoomIn: function (normalizedFactor) { // 0.1
      var para = {};
      para._zoomFactor = 1 - normalizedFactor;
      para.update = true;
      this.controls.update(para);
      this.render();
    },

    zoomOut: function (normalizedFactor) { // 0.1
      var para = {};
      para._zoomFactor = 1 + normalizedFactor;
      para.update = true;
      this.controls.update(para);
      this.render();
    },

    // rotate
    rotateLeft: function (degree) { // 5
      var axis = new THREE.Vector3(0,1,0);
      var angle = -degree / 180.0 * Math.PI;

      axis.applyQuaternion( this.camera.quaternion ).normalize();

      var quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle( axis, -angle );

      var para = {};
      para.quaternion = quaternion;
      para.update = true;

      this.controls.update(para);
      this.render();
    },

    rotateRight: function (degree) { // 5
      var axis = new THREE.Vector3(0,1,0);
      var angle = degree / 180.0 * Math.PI;

      axis.applyQuaternion( this.camera.quaternion ).normalize();

      var quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle( axis, -angle );

      var para = {};
      para.quaternion = quaternion;
      para.update = true;

      this.controls.update(para);
      this.render();
    },

    rotateUp: function (degree) { // 5
      var axis = new THREE.Vector3(1,0,0);
      var angle = -degree / 180.0 * Math.PI;

      axis.applyQuaternion( this.camera.quaternion ).normalize();

      var quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle( axis, -angle );

      var para = {};
      para.quaternion = quaternion;
      para.update = true;

      this.controls.update(para);
      this.render();
    },

    rotateDown: function (degree) { // 5
      var axis = new THREE.Vector3(1,0,0);
      var angle = degree / 180.0 * Math.PI;

      axis.applyQuaternion( this.camera.quaternion ).normalize();

      var quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle( axis, -angle );

      var para = {};
      para.quaternion = quaternion;
      para.update = true;

      this.controls.update(para);
      this.render();
    },

    // translate
    translateLeft: function (percentScreenSize) { // 1
      var mouseChange = new THREE.Vector2(0,0);

      // 1 means the full screen size
      mouseChange.x -= percentScreenSize / 100.0;

      var para = {};
      para.mouseChange = mouseChange;
      para.update = true;

      this.controls.update(para);
      this.render();
    },

    translateRight: function (percentScreenSize) { // 1
      var mouseChange = new THREE.Vector2(0,0);

      mouseChange.x += percentScreenSize / 100.0;

      var para = {};
      para.mouseChange = mouseChange;
      para.update = true;

      this.controls.update(para);
      this.render();
    },

    translateUp: function (percentScreenSize) { // 1
      var mouseChange = new THREE.Vector2(0,0);

      mouseChange.y -= percentScreenSize / 100.0;

      var para = {};
      para.mouseChange = mouseChange;
      para.update = true;

      this.controls.update(para);
      this.render();
    },

    translateDown: function (percentScreenSize) { // 1
      var mouseChange = new THREE.Vector2(0,0);

      mouseChange.y += percentScreenSize / 100.0;

      var para = {};
      para.mouseChange = mouseChange;
      para.update = true;

      this.controls.update(para);
      this.render();
    },

    showPicking: function(atom) {
      this.removeHighlightObjects();

      this.highlightAtoms = {};
      if(this.picking === 1) {
          this.highlightAtoms[atom.serial] = 1;
       }
      else if(this.picking === 2) {
        var residueid = atom.structure + '_' + atom.chain + '_' + atom.resi;
        this.highlightAtoms = this.residues[residueid];
      }

      this.addHighlightObjects();

      //var text = '#' + atom.structure + '.' + atom.chain + ':' + atom.resi + '@' + atom.name;
      var residueText = '.' + atom.chain + ':' + atom.resi;
      var text = residueText + '@' + atom.name;

      var labels = [];
      var label = {};
      label.position = atom.coord;

      if(this.picking === 1) {
        label.text = text;
      }
      else if(this.picking === 2) {
        label.text = residueText;
      }

      labels.push(label);

      //http://www.johannes-raida.de/tutorials/three.js/tutorial13/tutorial13.htm
      this.createLabelRepresentation(labels);
    },

    removeHighlightObjects: function () {
       // remove prevous highlight
       for(var i in this.prevHighlightObjects) {
           this.mdl.remove(this.prevHighlightObjects[i]);
       }

       this.prevHighlightObjects = [];

//       this.applyTransformation(this._zoomFactor, this.mouseChange, this.quaternion);
       this.render();
    },

    addHighlightObjects: function (color) {
       if(color === undefined) color = this.highlightColor;

       this.applyDisplayOptions(this.options, this.intersectHash(this.highlightAtoms, this.displayAtoms), this.bHighlight);

//       this.applyTransformation(this._zoomFactor, this.mouseChange, this.quaternion);
       this.render();
    },

    zoominSelection: function() {
       // center on the highlightAtoms if more than one residue is selected
       if(Object.keys(this.highlightAtoms).length > 1) {
               var centerAtomsResults = this.centerAtoms(this.hash2Atoms(this.highlightAtoms));
               this.maxD = centerAtomsResults.maxD;
               if (this.maxD < 25) this.maxD = 25;

               this.mdl.position.add(this.center).sub(centerAtomsResults.center);

               this.center = centerAtomsResults.center;

               // reset cameara
               this.setCamera();
       }

//       this.applyTransformation(this._zoomFactor, this.mouseChange, this.quaternion);
       this.render();
    }
};

/*! full_ui.js
 * UI with full features
 */

if (typeof jQuery === 'undefined') { throw new Error('iCn3DUI requires jQuery') }
if (typeof iCn3D === 'undefined') { throw new Error('iCn3DUI requires iCn3D') }

// make dialog movable outside of the window
// http://stackoverflow.com/questions/6696461/jquery-ui-dialog-drag-question
if (!$.ui.dialog.prototype._makeDraggableBase) {
    $.ui.dialog.prototype._makeDraggableBase = $.ui.dialog.prototype._makeDraggable;
    $.ui.dialog.prototype._makeDraggable = function() {
        this._makeDraggableBase();
        this.uiDialog.draggable("option", "containment", false);
    };
}

var iCn3DUI = function(cfg) {
    var me = this;

    me.cfg = cfg;
    me.divid = me.cfg.divid;
    me.pre = me.divid + "_";

    me.inputid = '';

    me.RESIDUE_WIDTH = 10;  // sequences
    me.RESIDUE_WIDTH2 = 10;  // aligned sequences
    me.MENU_HEIGHT = 40;

    // used to set the position for the log/command textarea
    me.MENU_WIDTH = 690;

    me.LESSWIDTH = 20;
    me.LESSHEIGHT = 20;

    me.ROTATION_DIRECTION = 'right';
    me.HIDE_SELECTION = true;
    me.ALTERNATE_STRUCTURE = -1;

    me.EXTRAHEIGHT = 2*me.MENU_HEIGHT;
    if(me.cfg.showmenu != undefined && me.cfg.showmenu == false) {
        me.EXTRAHEIGHT = 0;
    }

    me.SELECT_RESIDUE = false;
    me.selectedResidues = {};

    me.CRASHED = false;
    me.prevCommands = "";

    me.options = {};
    me.options['camera']             = 'perspective';        //perspective, orthographic
    me.options['background']         = 'black';              //black, grey, white
    me.options['color']              = 'spectrum';           //spectrum, chain, secondary structure, B factor, residue, polarity, atom, white, grey, red, green, blue, magenta, yellow, cyan, pink, lightgreen, brown, yellowtint, gold
    me.options['sidechains']         = 'nothing';            //lines, stick, ball & stick, sphere, nothing
    me.options['secondary']          = 'ribbon';             //ribbon, strand, cylinder & plate, C alpha trace, B factor tube, lines, stick, ball & stick, sphere, nothing
    me.options['surface']            = 'Van der Waals surface';    //Van der Waals surface, solvent excluded surface, solvent accessible surface, molecular surface, nothing
    me.options['opacity']            = '0.8';                //1.0, 0.9, 0.8, 0.7, 0.6, 0.5
    me.options['wireframe']          = 'no';                 //yes, no
    me.options['ligands']            = 'stick';              //lines, stick, ball & stick, sphere
    me.options['water']              = 'nothing';            //sphere, dot, nothing
    me.options['ions']               = 'sphere';             //sphere, dot, nothing
    me.options['hbonds']             = 'no';                 //yes, no
    me.options['labels']             = 'no';                 //yes, no
    me.options['lines']                   = 'no';                 //yes, no
    me.options['rotationcenter']     = 'molecule center';    //molecule center, pick center, display center
    me.options['axis']               = 'no';                 //yes, no
    me.options['picking']               = 'residue';                 //no, atom, residue
    me.options['nucleotides']        = 'phosphorus trace';   //nucleotide cartoon, phosphorus trace, lines, stick, ball & stick, sphere, nothing

    me.options['surfaceregion']      = 'nothing';            //nothing, all, sphere

    if(me.cfg.cid !== undefined) {
        me.options['picking'] = 'atom';
    }

    me.modifyIcn3d();

};

iCn3DUI.prototype = {

    constructor: iCn3DUI,

    // modify iCn3D function
    modifyIcn3d: function() {var me = this;
        me.modifyIcn3dShowPicking();
    },

    modifyIcn3dShowPicking: function() {var me = this;
        iCn3D.prototype.showPicking = function(atom) {
          this.removeHighlightObjects();

          this.highlightAtoms = {};

          if(this.picking === 1) {
              this.highlightAtoms[atom.serial] = 1;
           }
          else if(this.picking === 2) {
              var residueid = atom.structure + '_' + atom.chain + '_' + atom.resi;
              this.highlightAtoms = this.residues[residueid];
          }

          this.addHighlightObjects();

          if(this.picking === 2) {
              // highlight the sequence background
              var idArray = this.id.split('_'); // id: div0_canvas
              me.pre = idArray[0] + "_";

              var pickedResidue = atom.structure + '_' + atom.chain + '_' + atom.resi;

              me.clearSelection();

              me.removeSeqChainBkgd();
              me.removeSeqResidueBkgd();

              if($("#" + me.pre + pickedResidue).length !== 0) {
                $("#" + me.pre + pickedResidue).addClass('highlightSeq');
              }
          }
          else if(this.picking === 1) {
              me.removeSeqChainBkgd();
              me.removeSeqResidueBkgd();
          }

          var transformation = {};
          transformation.factor = this._zoomFactor;
          transformation.mouseChange = this.mouseChange;
          transformation.quaternion = this.quaternion;
          //this.transformation.push(transformation);

          this.commands.push('pickatom ' + atom.serial + '|||' + JSON.stringify(transformation));

          this.logs.push('pickatom ' + atom.serial + ' (chain: ' + atom.structure + '_' + atom.chain + ', residue: ' + atom.resn + ', number: ' + atom.resi + ', atom: ' + atom.name + ')');
          if ( $( "#" + me.pre + "logtext" ).length )  {
            $("#" + me.pre + "logtext").val("> " + this.logs.join("\n> ") + "\n> ").scrollTop($("#" + me.pre + "logtext")[0].scrollHeight);
          }
        };
    },

    // ======= functions start==============
    // show3DStructure is the main function to show 3D structure
    show3DStructure: function() { var me = this;
      me.deferred = $.Deferred(function() {
        if(me.isSessionStorageSupported()) me.getCommandsBeforeCrash();

        var width = window.innerWidth, height = window.innerHeight;

        if(me.cfg.width.toString().indexOf('%') !== -1) {
          width = width * me.cfg.width.substr(0, me.cfg.width.toString().indexOf('%')) / 100.0 - me.LESSWIDTH;
        }
        else {
          width = me.cfg.width;
        }

        if(me.cfg.height.toString().indexOf('%') !== -1) {
          height = height * me.cfg.height.substr(0, me.cfg.height.toString().indexOf('%')) / 100.0 - me.EXTRAHEIGHT - me.LESSHEIGHT;
        }
        else {
          height = me.cfg.height;
        }

        me.setMenu(me.divid);

        me.allEventFunctions();

        if(me.cfg.showmenu != undefined && me.cfg.showmenu == false) {
          me.EXTRAHEIGHT = 0;
          me.hideMenu(width, height);
        }
        else {
          me.EXTRAHEIGHT = 2*me.MENU_HEIGHT;
          me.showMenu(width, height);
        }

        me.icn3d = new iCn3D(me.pre + 'canvas');

        //resizeCanvas
        $("#" + me.pre + "canvas").width(width).height(height);
        var heightTmp = parseInt(height) + me.EXTRAHEIGHT;
        $("#" + me.pre + "viewer").width(width).height(heightTmp);
        me.icn3d.setWidthHeight(width, height);

        if(me.cfg.bCalphaOnly !== undefined) me.icn3d.bCalphaOnly = me.cfg.bCalphaOnly;

        //me.deferred = undefined; // sequential calls

        me.icn3d.cloneHash(me.options, me.icn3d.options);

        me.STATENUMBER = me.icn3d.commands.length;

        // If previously crashed, recover it
        if(me.isSessionStorageSupported() && me.CRASHED) {
            me.CRASHED = false;

            var loadCommand = me.commandsBeforeCrash.split('|||')[0];
            var id = loadCommand.substr(loadCommand.lastIndexOf(' ') + 1);

            // reload only if viewing the same structure
            if(id === me.cfg.pdbid || id === me.cfg.mmdbid || id === me.cfg.gi || id === me.cfg.cid || id === me.cfg.mmcif || id === me.cfg.align) {
                me.loadStateFile(me.commandsBeforeCrash);

                return;
            }
        }

        if(me.cfg.pdbid !== undefined) {
           me.inputid = me.cfg.pdbid;

           var protocol = document.location.protocol;

           //var pdbid = me.cfg.pdbid.toLowerCase();
           var pdbid = me.cfg.pdbid;

           if(protocol === 'http:') {
             me.setLogCommand('load pdb ' + me.cfg.pdbid, true);

             me.downloadPdb(pdbid);
           }
           else if(protocol === 'https:') {
             me.setLogCommand('load mmdb ' + me.cfg.pdbid, true);
             me.downloadMmdb(pdbid);
           }
        }
        else if(me.cfg.mmdbid !== undefined) {
           me.inputid = me.cfg.mmdbid;

            me.icn3d.moleculeTitle = 'MMDB ID ' + me.cfg.mmdbid;

            me.setLogCommand('load mmdb ' + me.cfg.mmdbid, true);

            me.downloadMmdb(me.cfg.mmdbid);
        }
        else if(me.cfg.gi !== undefined) {
           me.inputid = me.cfg.gi;

            me.icn3d.moleculeTitle = 'Protein gi ' + me.cfg.mmdbid;

            me.setLogCommand('load gi ' + me.cfg.gi, true);

            me.downloadGi(me.cfg.gi);
        }
        else if(me.cfg.cid !== undefined) {
           me.inputid = me.cfg.cid;

            me.icn3d.moleculeTitle = 'PubChem CID ' + me.cfg.cid;

            me.setLogCommand('load cid ' + me.cfg.cid, true);

            me.downloadCid(me.cfg.cid);
        }
        else if(me.cfg.mmcif !== undefined) {
           me.inputid = me.cfg.mmcif;

            me.icn3d.moleculeTitle = 'mmCIF ' + me.cfg.mmcif;

            me.setLogCommand('load mmcif ' + me.cfg.mmcif, true);

            me.downloadMmcif(me.cfg.mmcif);
        }
        else if(me.cfg.align !== undefined) {
            var alignArray = me.cfg.align.split(','); // e.g., 103701,1,4,68563,1,167 [mmdbid1,biounit,molecule,mmdbid2,biounit,molecule]

            me.inputid = alignArray[0] + "_" + alignArray[3];

            me.icn3d.moleculeTitle = 'Structure Alignment of MMDB ID ' + alignArray[0] + ' (BioUnit ' + alignArray[1] + ', Molecule ' + alignArray[2] + ') and MMDB ID ' + alignArray[3] + ' (BioUnit ' + alignArray[4] + ', Molecule ' + alignArray[5] + ')';

            me.setLogCommand('load alignment ' + me.cfg.align, true);

            me.downloadAlignment(me.cfg.align);
        }
        else {
            alert("Please input a gi, MMDB ID, PDB ID, CID, or mmCIF...");
        }
      });

      return me.deferred;
    },

    clearSelection: function() { var me = this;
        $("#" + me.pre + "chainid").val("");
        $("#" + me.pre + "structureid").val("");
        $("#" + me.pre + "alignChainid").val("");
        $("#" + me.pre + "customResidues").val("");

        $("#" + me.pre + "chainid2").val("");
        $("#" + me.pre + "structureid2").val("");
        $("#" + me.pre + "alignChainid2").val("");
        $("#" + me.pre + "customResidues2").val("");

        $("#" + me.pre + "customAtoms").val("");
    },

    // remove highlight of chains
    removeSeqChainBkgd: function(currChain) {
        $( ".seqTitle" ).each(function( index ) {
          if(currChain === undefined) {
              $( this ).removeClass('highlightSeq');
          }
          else {
              if($(this).attr('chain') !== currChain) $( this ).removeClass('highlightSeq');
          }
        });
    },

    // remove all highlighted residue color
    removeSeqResidueBkgd: function() {
        $( ".residue" ).each(function( index ) {
          $( this ).removeClass('highlightSeq');
        });
    },

    hideMenu: function(width, height) { var me = this;
      if($("#" + me.pre + "menulist")[0] !== undefined) $("#" + me.pre + "menulist")[0].style.display = "none";
      if($("#" + me.pre + "menuLogSection")[0] !== undefined) $("#" + me.pre + "menuLogSection")[0].style.display = "none";
      if($("#" + me.pre + "commandlog")[0] !== undefined) $("#" + me.pre + "commandlog")[0].style.display = "none";
      if($("#" + me.pre + "selection")[0] !== undefined) $("#" + me.pre + "selection")[0].style.display = "none";

      $("#" + me.pre + "viewer").width(width).height(height);
      $("#" + me.pre + "canvas").width(width).height(height);
    },

    showMenu: function(width, height) { var me = this;
      if($("#" + me.pre + "menulist")[0] !== undefined) $("#" + me.pre + "menulist")[0].style.display = "block";
      if($("#" + me.pre + "menuLogSection")[0] !== undefined) $("#" + me.pre + "menuLogSection")[0].style.display = "block";
      if($("#" + me.pre + "commandlog")[0] !== undefined) $("#" + me.pre + "commandlog")[0].style.display = "block";
      if($("#" + me.pre + "selection")[0] !== undefined) $("#" + me.pre + "selection")[0].style.display = "block";

      var heightTmp = parseInt(height) + me.EXTRAHEIGHT;
      $("#" + me.pre + "viewer").width(width).height(heightTmp);
      $("#" + me.pre + "canvas").width(width).height(height);
    },

    resizeCanvas: function (width, height) { var me = this;
      if(me.cfg.resize !== undefined && me.cfg.resize && !me.isMobile() ) {

        var heightTmp = parseInt(height) - me.EXTRAHEIGHT;
        $("#" + me.pre + "canvas").width(width).height(heightTmp);

        $("#" + me.pre + "viewer").width(width).height(height);

        me.icn3d.setWidthHeight(width, heightTmp);

        me.icn3d.draw();
      }
    },

    setOption: function (id, value) { var me = this;
      var options2 = {};
      options2[id] = value;

      if(id === 'color') {
          me.icn3d.setColorByOptions(options2, me.icn3d.highlightAtoms);

          // update the color in sequence display
          if(me.icn3d.chainsColor && Object.keys(me.icn3d.chainsColor).length > 0) {
              var seqObj = me.getSequencesAnnotations(Object.keys(me.icn3d.chains), false);
              $("#" + me.pre + "dl_sequence").html(seqObj.sequencesHtml);
              $("#" + me.pre + "dl_sequence").width(me.RESIDUE_WIDTH * seqObj.maxSeqCnt + 200);

              seqObj = me.getAlignSequencesAnnotations(Object.keys(me.icn3d.alignChains), false);
              $("#" + me.pre + "dl_sequence2").html(seqObj.sequencesHtml);
              $("#" + me.pre + "dl_sequence2").width(me.RESIDUE_WIDTH2 * seqObj.maxSeqCnt + 200);
          }
      }

      me.icn3d.draw(options2);
    },

    setStyle: function (selectionType, style) { var me = this;
      var atoms = {};
      switch (selectionType) {
          case 'protein':
              atoms = me.icn3d.intersectHash(me.icn3d.highlightAtoms, me.icn3d.peptides);
              break;
//          case 'sidechains':
//              atoms = me.icn3d.intersectHash(me.icn3d.highlightAtoms, me.icn3d.peptides);
//              break;
          case 'nucleotides':
              atoms = me.icn3d.intersectHash(me.icn3d.highlightAtoms, me.icn3d.nucleotides);
              break;
          case 'ligands':
              atoms = me.icn3d.intersectHash(me.icn3d.highlightAtoms, me.icn3d.ligands);
              break;
          case 'ions':
              atoms = me.icn3d.intersectHash(me.icn3d.highlightAtoms, me.icn3d.ions);
              break;
          case 'water':
              atoms = me.icn3d.intersectHash(me.icn3d.highlightAtoms, me.icn3d.water);
              break;
      }

      for(var i in atoms) {
        me.icn3d.atoms[i].style = style;
      }

      me.icn3d.draw();
    },

    setLogCommand: function (str, bSetCommand) { var me = this;
      var transformation = {};
      transformation.factor = me.icn3d._zoomFactor;
      transformation.mouseChange = me.icn3d.mouseChange;
      transformation.quaternion = me.icn3d.quaternion;
      //me.icn3d.transformation.push(transformation);

      if(bSetCommand) {
        me.icn3d.commands.push(str + '|||' + JSON.stringify(transformation));

        if(me.isSessionStorageSupported()) me.saveCommandsToSession();

        me.STATENUMBER = me.icn3d.commands.length;
      }

      me.icn3d.logs.push(str);

      // move cursor to the end, and scroll to the end
      $("#" + me.pre + "logtext").val("> " + me.icn3d.logs.join("\n> ") + "\n> ").scrollTop($("#" + me.pre + "logtext")[0].scrollHeight);
    },

    openDialog: function (id, title) {  var me = this;
        var width = 400, height = 150;

        var bExpandDialog = me.isMac() && !me.isMobile();

        if(id === me.pre + 'dl_selectresidues' || id === me.pre + 'dl_alignment') {
            if($( window ).width() > $( window ).height() ) {
                me.resizeCanvas(0.5 * $( window ).width(), $( window ).height() - me.LESSHEIGHT);

                height = bExpandDialog ? 'auto' : $( window ).height() - me.LESSHEIGHT - 2*me.MENU_HEIGHT;
                width = bExpandDialog ? 'auto' : 0.5 * $( window ).width() - me.LESSWIDTH;

                var position ={ my: "left top", at: "right top", of: "#" + me.pre + "canvas", collision: "none" };

                // disable resize
                me.cfg.resize = false;

                window.dialog = $( "#" + id ).dialog({
                  autoOpen: true,
                  title: title,
                  height: height,
                  width: width,
                  modal: false,
                  position: position,
                  close: function(e) {
                      me.cfg.resize = true;
                      me.resizeCanvas($( window ).width() - me.LESSWIDTH, $( window ).height() - me.LESSHEIGHT);
                  }
                });
            }
            else {
                if(me.isMobile()) me.resizeCanvas($( window ).width() - me.LESSWIDTH, $( window ).height() - me.LESSHEIGHT - 30);

                height = bExpandDialog ? 'auto' : 250;
                width = bExpandDialog ? 'auto' : $( window ).width() - me.LESSWIDTH;

                var position ={ my: "left top", at: "left bottom-30", of: "#" + me.pre + "canvas", collision: "none" };

                window.dialog = $( "#" + id ).dialog({
                  autoOpen: true,
                  title: title,
                  height: height,
                  width: width,
                  modal: false,
                  position: position
                });
            }
        }
        else {
            height = 'auto';
            width = 'auto';

            var position ={ my: "left top", at: "left bottom-30", of: "#" + me.pre + "canvas", collision: "none" };

            window.dialog = $( "#" + id ).dialog({
              autoOpen: true,
              title: title,
              height: height,
              width: width,
              modal: false,
              position: position
            });
        }

        $(".ui-dialog .ui-button span")
          .removeClass("ui-icon-closethick")
          .addClass("ui-icon-close");
    },

    renderStructure: function (bInitial) {  var me = this;
      var structuresHtml = me.getStructureSelections(bInitial);
      var chainsHtml = me.getChainSelections(bInitial);
      var alignChainsHtml = me.getAlignChainSelections();
      var definedResiduesHtml = me.getResidueSelections();
      var definedAtomsHtml = me.getAtomSelections();

      if($("#" + me.pre + "structureid")) $("#" + me.pre + "structureid").html(structuresHtml);
      if($("#" + me.pre + "chainid")) $("#" + me.pre + "chainid").html(chainsHtml);
      if($("#" + me.pre + "alignChainid")) $("#" + me.pre + "alignChainid").html(alignChainsHtml);
      if($("#" + me.pre + "customResidues")) $("#" + me.pre + "customResidues").html(definedResiduesHtml);

      if($("#" + me.pre + "structureid2")) $("#" + me.pre + "structureid2").html(structuresHtml);
      if($("#" + me.pre + "chainid2")) $("#" + me.pre + "chainid2").html(chainsHtml);
      if($("#" + me.pre + "alignChainid2")) $("#" + me.pre + "alignChainid2").html(alignChainsHtml);
      if($("#" + me.pre + "customResidues2")) $("#" + me.pre + "customResidues2").html(definedResiduesHtml);

      if($("#" + me.pre + "customAtoms")) $("#" + me.pre + "customAtoms").html(definedAtomsHtml);

      var seqObj = me.getSequencesAnnotations(Object.keys(me.icn3d.chains));
      if($("#" + me.pre + "dl_sequence")) {
          $("#" + me.pre + "dl_sequence").html(seqObj.sequencesHtml);
            $("#" + me.pre + "dl_sequence").width(me.RESIDUE_WIDTH * seqObj.maxSeqCnt + 200);
      }

      seqObj = me.getAlignSequencesAnnotations(Object.keys(me.icn3d.alignChains));
      if($("#" + me.pre + "dl_sequence2")) {
          $("#" + me.pre + "dl_sequence2").html(seqObj.sequencesHtml);
            $("#" + me.pre + "dl_sequence2").width(me.RESIDUE_WIDTH2 * seqObj.maxSeqCnt + 200);
      }

      if(bInitial) {
        me.icn3d.draw(me.options);
      }
      else {
        me.icn3d.draw();
      }

      if(me.cfg.command !== undefined) {
          me.loadStateFile(me.cfg.command);
      }
    },

    downloadPdb: function (pdbid) { var me = this;
       //var uri = "//testpubchem.ncbi.nlm.nih.gov/wangjiy/me.icn3d/" + pdbid + ".pdb";
       //var uri = "http://www.rcsb.org/pdb/files/" + pdbid + ".pdb";
       var uri = "//www.ncbi.nlm.nih.gov/Structure/mmcifparser/mmcifparser.cgi?pdbid=" + pdbid;

       me.icn3d.bCid = undefined;

       $.ajax({
          url: uri,
          dataType: 'text',
          cache: true,
          beforeSend: function() {
              if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").show();
              if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").hide();
              if($("#" + me.pre + "log")) $("#" + me.pre + "log").hide();
          },
          complete: function() {
              if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").hide();
              if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").show();
              if($("#" + me.pre + "log")) $("#" + me.pre + "log").show();
          },
          success: function(data) {
              me.loadPdbData(data);
          }
       });
    },

    loadPdbData: function(data) { var me = this;
        me.icn3d.loadPDB(data);

        me.pmid = me.icn3d.pmid;

        if(me.cfg.align === undefined && Object.keys(me.icn3d.structures).length == 1) {
            $("#" + me.pre + "alternateWrapper").hide();
        }

        me.icn3d.inputid.idtype = "pdbid";
        me.icn3d.inputid.id = pdbid;

        me.icn3d.setAtomStyleByOptions(me.options);
        me.icn3d.setColorByOptions(me.options, me.icn3d.atoms);

        me.renderStructure(true);

        if(me.cfg.rotate !== undefined) me.rotateStructure(me.cfg.rotate, true);

        if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();
    },

    rotateStructure: function (direction, bInitial) { var me = this;
        if(me.icn3d.bStopRotate) return false;

        if(bInitial !== undefined && bInitial) {
            if(direction === 'left') {
              me.ROTATION_DIRECTION = 'left';
            }
            else if(direction === 'right') {
              me.ROTATION_DIRECTION = 'right';
            }
            else if(direction === 'up') {
              me.ROTATION_DIRECTION = 'up';
            }
            else if(direction === 'down') {
              me.ROTATION_DIRECTION = 'down';
            }
            else {
              return false;
            }
        }

        if(direction === 'left' && me.ROTATION_DIRECTION === 'left') {
          me.icn3d.rotateLeft(5);
        }
        else if(direction === 'right' && me.ROTATION_DIRECTION === 'right') {
          me.icn3d.rotateRight(5);
        }
        else if(direction === 'up' && me.ROTATION_DIRECTION === 'up') {
          me.icn3d.rotateUp(5);
        }
        else if(direction === 'down' && me.ROTATION_DIRECTION === 'down') {
          me.icn3d.rotateDown(5);
        }
        else {
          return false;
        }

        setTimeout(function(){ me.rotateStructure(direction); }, 1000);
    },

    downloadMmcif: function (mmcif) { var me = this;
        var url = "//www.ncbi.nlm.nih.gov/Structure/mmcifparser/mmcifparser.cgi?mmcif=" + mmcif;
        me.icn3d.bCid = undefined;

       $.ajax({
          url: url,
          dataType: 'jsonp',
          cache: true,
          beforeSend: function() {
              if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").show();
              if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").hide();
              if($("#" + me.pre + "log")) $("#" + me.pre + "log").hide();
          },
          complete: function() {
              if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").hide();
              if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").show();
              if($("#" + me.pre + "log")) $("#" + me.pre + "log").show();
          },
          success: function(data) {
                me.loadMmcifData(data);
          }
        });
    },

    loadMmcifData: function(data) { var me = this;
        if (data.atoms !== undefined) {
            me.loadAtomDataIn(data, data.mmcif, 'mmcif');

            if(me.cfg.align === undefined && Object.keys(me.icn3d.structures).length == 1) {
                $("#" + me.pre + "alternateWrapper").hide();
            }

            // load assembly info
            var assembly = data.assembly;
            for(var i = 0, il = assembly.length; i < il; ++i) {
              if (me.icn3d.biomtMatrices[i] == undefined) me.icn3d.biomtMatrices[i] = new THREE.Matrix4().identity();

              for(var j = 0, jl = assembly[i].length; j < jl; ++j) {
                me.icn3d.biomtMatrices[i].elements[j] = assembly[i][j];
              }
            }

            me.icn3d.inputid.idtype = "mmcif";
            me.icn3d.inputid.id = mmcif;

            me.icn3d.setAtomStyleByOptions(me.options);
            me.icn3d.setColorByOptions(me.options, me.icn3d.atoms);

            me.renderStructure(true);

            if(me.cfg.rotate !== undefined) me.rotateStructure(me.cfg.rotate, true);

            if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();
        }
        else {
            alert('invalid atoms data.');
            return false;
        }
    },

    downloadAlignment: function (align) { var me = this;
        var url = "//structure.ncbi.nlm.nih.gov/Structure/vastpp/vastpp.cgi?cmd=c&w3d&ids=" + align;
        var url2 = "//structure.ncbi.nlm.nih.gov/Structure/vastpp/vastpp.cgi?cmd=c1&d&ids=" + align;
        if(me.cfg.inpara !== undefined) {
          url += me.cfg.inpara;
          url2 += me.cfg.inpara;
        }

        me.icn3d.bCid = undefined;

        // define for 'align' only
        me.icn3d.pdbid_chain2title = {};

        var request = $.ajax({
           url: url2,
           //dataType: 'json',
           dataType: 'jsonp',
           //jsonp: 'jpf',
           cache: true,
          beforeSend: function() {
              if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").show();
              if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").hide();
              if($("#" + me.pre + "log")) $("#" + me.pre + "log").hide();
          },
          complete: function() {
              if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").hide();
              if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").show();
              if($("#" + me.pre + "log")) $("#" + me.pre + "log").show();
          }
        });

        var seqalign = {};

        var chained = request.then(function( data ) {
            seqalign = data.seqalign;

            var index = 0;
            for(var mmdbid in data) {
                if(index < 2) {
                    var pdbid = data[mmdbid].pdbid;
                    //me.icn3d.mmdbid2pdbid[mmdbid] = pdbid;

                    var molecule = data[mmdbid].molecule;
                    for(var molname in molecule) {
                        var chain = molecule[molname].chain;
                        me.icn3d.pdbid_chain2title[pdbid + '_' + chain] = molecule[molname].name;
                    }
                }

                ++index;
            }

            return $.ajax({
               url: url,
               dataType: 'jsonp',
               //jsonp: 'jpf',
               cache: true,
              beforeSend: function() {
                  if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").show();
                  if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").hide();
                  if($("#" + me.pre + "log")) $("#" + me.pre + "log").hide();
              },
              complete: function() {
                  if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").hide();
                  if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").show();
                  if($("#" + me.pre + "log")) $("#" + me.pre + "log").show();
              }
            });
        });

        chained.done(function( data ) {
            if (data.atoms !== undefined) {
                me.loadAtomDataIn(data, undefined, 'align', seqalign);

                if(me.cfg.align === undefined && Object.keys(me.icn3d.structures).length == 1) {
                    $("#" + me.pre + "alternateWrapper").hide();
                }

                me.icn3d.inputid.idtype = "alignment";
                me.icn3d.inputid.id = align;

                me.icn3d.setAtomStyleByOptions(me.options);
                // use the original color from cgi output
                me.icn3d.setColorByOptions(me.options, me.icn3d.atoms, true);

                me.renderStructure(true);

                if(me.cfg.rotate !== undefined) me.rotateStructure(me.cfg.rotate, true);

                // by default, open the seq alignment window
                if(me.cfg.bShowSeqByDefault !== undefined && me.cfg.bShowSeqByDefault) me.openDialog(me.pre + 'dl_alignment', 'Select residues in aligned sequences');

                if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();
            }
            else {
                alert('invalid atoms data.');
                return false;
            }
        });
    },

    downloadCid: function (cid) { var me = this;
        var uri = "//pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/" + cid + "/record/SDF/?record_type=3d&response_type=display";

        me.icn3d.bCid = true;

        $.ajax({
          url: uri,
          dataType: 'text',
          cache: true,
          beforeSend: function() {
              if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").show();
              if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").hide();
              if($("#" + me.pre + "log")) $("#" + me.pre + "log").hide();
          },
          complete: function() {
              if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").hide();
              if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").show();
              if($("#" + me.pre + "log")) $("#" + me.pre + "log").show();
          },
          success: function(data) {
            var bResult = me.loadCidAtomData(data);

            if(me.cfg.align === undefined && Object.keys(me.icn3d.structures).length == 1) {
                $("#" + me.pre + "alternateWrapper").hide();
            }

            if(!bResult) {
              alert('The SDF of CID ' + cid + ' has the wrong format...');
            }
            else {
              me.icn3d.inputid.idtype = "cid";
              me.icn3d.inputid.id = cid;

              me.icn3d.setAtomStyleByOptions(me.options);
              me.icn3d.setColorByOptions(me.options, me.icn3d.atoms);

              me.renderStructure(true);

              if(me.cfg.rotate !== undefined) me.rotateStructure(me.cfg.rotate, true);

              if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();
            }
          }
        })
        .fail(function() {
            alert( "This CID may not have 3D structure..." );
        });
    },

    loadCidAtomData: function (data) { var me = this;
        var lines = data.split('\n');
        if (lines.length < 4) return false;

        me.icn3d.init();

        var structure = '1';
        var chain = 'A';
        var resi = 1;
        var resn = 'LIG';

        var moleculeNum = structure;
        var chainNum = structure + '_' + chain;
        var residueNum = chainNum + '_' + resi;

        var atomCount = parseInt(lines[3].substr(0, 3));
        if (isNaN(atomCount) || atomCount <= 0) return false;

        var bondCount = parseInt(lines[3].substr(3, 3));
        var offset = 4;
        if (lines.length < offset + atomCount + bondCount) return false;

        var start = 0;
        var end = atomCount;
        var i, line;
        var AtomHash = {};
        for (i = start; i < end; i++) {
            line = lines[offset];
            offset++;

            var serial = i;

            var x = parseFloat(line.substr(0, 10));
            var y = parseFloat(line.substr(10, 10));
            var z = parseFloat(line.substr(20, 10));
            var coord = new THREE.Vector3(x, y, z);

            var name = line.substr(31, 3).replace(/ /g, "");

            var atomDetails = {
                het: true,              // optional, used to determine ligands, water, ions, etc
                serial: serial,         // required, unique atom id
                name: name,             // required, atom name
                resn: resn,             // optional, used to determine protein or nucleotide
                structure: structure,   // optional, used to identify structure
                chain: chain,           // optional, used to identify chain
                resi: resi,             // optional, used to identify residue ID
                coord: coord,           // required, used to draw 3D shape
                b: 0,                   // optional, used to draw B-factor tube
                elem: name,             // optional, used to determine hydrogen bond
                bonds: [],              // required, used to connect atoms
                ss: 'coil',             // optional, used to show secondary structures
                ssbegin: false,         // optional, used to show the beginning of secondary structures
                ssend: false,           // optional, used to show the end of secondary structures

                bondOrder: []           // optional, specific for chemicals
            };

            me.icn3d.atoms[serial] = atomDetails;
            AtomHash[serial] = 1;
        }

        me.icn3d.displayAtoms = AtomHash;
        me.icn3d.highlightAtoms= AtomHash;
        me.icn3d.structures[moleculeNum] = [chainNum]; //AtomHash;
        me.icn3d.chains[chainNum] = AtomHash;
        me.icn3d.residues[residueNum] = AtomHash;

        me.icn3d.residueId2Name[residueNum] = resn;

        if(me.icn3d.chainsSeq[chainNum] === undefined) me.icn3d.chainsSeq[chainNum] = [];
        if(me.icn3d.chainsAnno[chainNum] === undefined ) me.icn3d.chainsAnno[chainNum] = [];
        if(me.icn3d.chainsAnno[chainNum][0] === undefined ) me.icn3d.chainsAnno[chainNum][0] = [];
        if(me.icn3d.chainsAnnoTitle[chainNum] === undefined ) me.icn3d.chainsAnnoTitle[chainNum] = [];
        if(me.icn3d.chainsAnnoTitle[chainNum][0] === undefined ) me.icn3d.chainsAnnoTitle[chainNum][0] = [];

          var resObject = {};
          resObject.resi = resi;
          resObject.name = resn;

        me.icn3d.chainsSeq[chainNum].push(resObject);
        me.icn3d.chainsAnno[chainNum][0].push(resi);
        me.icn3d.chainsAnnoTitle[chainNum][0].push('');

        for (i = 0; i < bondCount; i++) {
            line = lines[offset];
            offset++;
            var from = parseInt(line.substr(0, 3)) - 1 + start;
            var to = parseInt(line.substr(3, 3)) - 1 + start;
            var order = parseInt(line.substr(6, 3));
            me.icn3d.atoms[from].bonds.push(to);
            me.icn3d.atoms[from].bondOrder.push(order);
            me.icn3d.atoms[to].bonds.push(from);
            me.icn3d.atoms[to].bondOrder.push(order);
        }

        var pmin = new THREE.Vector3( 9999, 9999, 9999);
        var pmax = new THREE.Vector3(-9999,-9999,-9999);
        var psum = new THREE.Vector3();
        var cnt = 0;
        // assign atoms
        for (var i in me.icn3d.atoms) {
            var atom = me.icn3d.atoms[i];
            var coord = atom.coord;
            psum.add(coord);
            pmin.min(coord);
            pmax.max(coord);
            ++cnt;

            if(atom.het) {
              if($.inArray(atom.elem, me.icn3d.ionsArray) !== -1) {
                me.icn3d.ions[atom.serial] = 1;
              }
              else {
                me.icn3d.ligands[atom.serial] = 1;
              }
            }
        } // end of for


        me.icn3d.pmin = pmin;
        me.icn3d.pmax = pmax;

        me.icn3d.cnt = cnt;

        me.icn3d.maxD = me.icn3d.pmax.distanceTo(me.icn3d.pmin);
        me.icn3d.center = psum.multiplyScalar(1.0 / me.icn3d.cnt);

        if (me.icn3d.maxD < 25) me.icn3d.maxD = 25;

        return true;
    },

    downloadMmdb: function (mmdbid) { var me = this;
       var url = "//www.ncbi.nlm.nih.gov/Structure/mmdb/mmdb_strview.cgi?program=w3d&uid=" + mmdbid;
       //var url = "//structuredev24.be-md.ncbi.nlm.nih.gov/Structure/mmdb/mmdb_strview.cgi?program=w3d&uid=" + mmdbid;

       me.icn3d.bCid = undefined;

       if(me.cfg.inpara !== undefined) {
         url += me.cfg.inpara;
       }

       $.ajax({
          url: url,
          dataType: 'jsonp',
          cache: true,
          beforeSend: function() {
              if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").show();
              if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").hide();
              if($("#" + me.pre + "log")) $("#" + me.pre + "log").hide();
          },
          complete: function() {
              if($("#" + me.pre + "wait")) $("#" + me.pre + "wait").hide();
              if($("#" + me.pre + "canvas")) $("#" + me.pre + "canvas").show();
              if($("#" + me.pre + "log")) $("#" + me.pre + "log").show();
          },
          success: function(data) {
            if ((me.cfg.inpara !== undefined && me.cfg.inpara.indexOf('mols=') != -1) || (data.atomcount <= data.threshold && data.atoms !== undefined) ) {
                // small structure with all atoms
                var id = (data.pdbId !== undefined) ? data.pdbId : data.mmdbId;
                me.loadAtomDataIn(data, id, 'mmdbid');

                if(me.cfg.align === undefined && Object.keys(me.icn3d.structures).length == 1) {
                    if($("#" + me.pre + "alternateWrapper") !== null) $("#" + me.pre + "alternateWrapper").hide();
                }

                me.icn3d.inputid.idtype = "mmdbid";
                me.icn3d.inputid.id = id;

                me.icn3d.setAtomStyleByOptions(me.options);
                // use the original color from cgi output
                me.icn3d.setColorByOptions(me.options, me.icn3d.atoms, true);

                me.renderStructure(true);

                if(me.cfg.rotate !== undefined) me.rotateStructure(me.cfg.rotate, true);

                //if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();
            }

            if(me.cfg.inpara !== undefined && me.cfg.inpara.indexOf('mols=') == -1 && data.atomcount > data.threshold && data.molid2rescount !== undefined) {
                var labelsize = 40;

                // large struture with helix/brick, phosphorus, and ligand info
                me.icn3d.bSSOnly = true;

                // load atom info
                var id = (data.pdbId !== undefined) ? data.pdbId : data.mmdbId;
                me.loadAtomDataIn(data, id, 'mmdbid');

                me.icn3d.inputid.idtype = "mmdbid";
                me.icn3d.inputid.id = id;

                me.options['nucleotides'] = 'phosphorus lines';

                //me.options['color'] = 'spectrum';

                me.icn3d.setAtomStyleByOptions(me.options);
                // use the original color from cgi output
                me.icn3d.setColorByOptions(me.options, me.icn3d.atoms, true);

                var molid2rescount = data.molid2rescount;
                var molid2color = {}, chain2molid = {}, molid2chain = {};

                var html = "<table width='100%'><tr><td></td><th>#</th><th align='center'>Chain</th><th align='center'>Residue Count</th></tr>";

                var index = 1;
                for(var i in molid2rescount) {
                  var color = '#' + ( '000000' + molid2rescount[i].color.toString( 16 ) ).slice( - 6 );
                  html += "<tr style='color:" + color + "'><td><input type='checkbox' name='" + me.pre + "filter_ckbx' value='" + i + "'/></td><td align='center'>" + index + "</td><td align='center'>" + molid2rescount[i].chain + "</td><td align='center'>" + molid2rescount[i].resCount + "</td></tr>";

                  molid2color[i] = color;
                  var chain = id + '_' + molid2rescount[i].chain;
                  chain2molid[chain] = i;
                  molid2chain[i] = chain;
                  ++index;
                }

                if(Object.keys(me.icn3d.ligands).length > 0) {
                  html += "<tr><td><input type='checkbox' name='" + me.pre + "filter_ckbx' value='ligands'/></td><td align='center'>" + index + "</td><td align='center'>Ligands</td><td align='center'>" + Object.keys(me.icn3d.ligands).length + " atoms</td></tr>";
                }

                html += "</table>";

                 // add labels for each RNA/DNA molecule
                 // hash of molid to label object
                 var labels = {};

                 for(var i in me.icn3d.chains) {
                     var label = {}; // Each label contains 'position', 'text', 'color', 'background'

                     var position = me.icn3d.centerAtoms(me.icn3d.hash2Atoms(me.icn3d.chains[i])).center;
                     label.position = position;

                     var chain = i.substr(i.indexOf('_') + 1);
                     label.text = chain;
                     label.size = labelsize;
                     label.color = molid2color[chain2molid[i]];
                     label.background = "#FFFFFF";

                     labels[chain2molid[i]] = label;
                 }

                // get brick and helix info to draw secondary structure for the coarse 3D view
                molid2ss = {}; // hash of molid -> array of object
                for(var i in data.helix) {
                  for(var j = 0, jl = data.helix[i].length; j < jl; ++j) {
                    var helix = data.helix[i][j];

                    var resiCoords = {};

                    resiCoords.type = 'helix';
                    resiCoords.startResi = helix.from;
                    resiCoords.endResi = helix.to;

                    // helix from and to coords are switched
                    resiCoords.coords = [];
                    resiCoords.coords.push(helix.end);
                    resiCoords.coords.push(helix.start);

                    if(molid2ss[i] === undefined) molid2ss[i] = [];
                    molid2ss[i].push(resiCoords);
                  }
                }

                for(var i in data.brick) {
                  for(var j = 0, jl = data.brick[i].length; j < jl; ++j) {
                    var brick = data.brick[i][j];

                    var resiCoords = {};

                    resiCoords.type = 'brick';
                    resiCoords.startResi = brick.from;
                    resiCoords.endResi = brick.to;

                    // coords
                    resiCoords.coords = [];
                    var start = {}, end = {}, direction = {};

                    start.x = 0.25 * (brick['000'][0] + brick['010'][0] + brick['011'][0] + brick['001'][0]);
                    start.y = 0.25 * (brick['000'][1] + brick['010'][1] + brick['011'][1] + brick['001'][1]);
                    start.z = 0.25 * (brick['000'][2] + brick['010'][2] + brick['011'][2] + brick['001'][2]);

                    end.x = 0.25 * (brick['100'][0] + brick['110'][0] + brick['111'][0] + brick['101'][0]);
                    end.y = 0.25 * (brick['100'][1] + brick['110'][1] + brick['111'][1] + brick['101'][1]);
                    end.z = 0.25 * (brick['100'][2] + brick['110'][2] + brick['111'][2] + brick['101'][2]);

                    direction.x = brick['010'][0] - brick['000'][0];
                    direction.y = brick['010'][1] - brick['000'][1];
                    direction.z = brick['010'][2] - brick['000'][2];

                    resiCoords.coords.push(start);
                    resiCoords.coords.push(end);
                    resiCoords.coords.push(direction);

                    if(molid2ss[i] === undefined) molid2ss[i] = [];
                    molid2ss[i].push(resiCoords);
                  }
                }

                // sort the arrays
                for(var i in molid2ss) {
                    molid2ss[i].sort(function(a, b) {
                        return parseFloat(a.startResi) - parseFloat(b.startResi);
                    });
                }

                // set the center and maxD
                if(me.icn3d.cnt !== 0) {
                    var pmin = me.icn3d.pmin;
                    var pmax = me.icn3d.pmax;
                    var psum = me.icn3d.center.multiplyScalar(me.icn3d.cnt);
                    var cnt = me.icn3d.cnt;
                }
                else {
                    var pmin = new THREE.Vector3( 9999, 9999, 9999);
                    var pmax = new THREE.Vector3(-9999,-9999,-9999);
                    var psum = new THREE.Vector3();
                    var cnt = 0;
                }

                for(var i in molid2ss) {
                    var pminMolid = new THREE.Vector3( 9999, 9999, 9999);
                    var pmaxMolid = new THREE.Vector3(-9999,-9999,-9999);
                    var psumMolid = new THREE.Vector3();
                    var cntMolid= 0;

                    for(var j = 0, jl = molid2ss[i].length; j < jl; ++j) {
                        var coord = molid2ss[i][j].coords[0];
                        pmin.min(coord);
                        pmax.max(coord);
                        psum.add(coord);

                        pminMolid.min(coord);
                        pmaxMolid.max(coord);
                        psumMolid.add(coord);

                        ++cnt;
                        ++cntMolid;

                        coord = molid2ss[i][j].coords[1];
                        pmin.min(coord);
                        pmax.max(coord);
                        psum.add(coord);

                        pminMolid.min(coord);
                        pmaxMolid.max(coord);
                        psumMolid.add(coord);

                        ++cnt;
                        ++cntMolid;
                    }

                    var centerMolid = psumMolid.multiplyScalar(1.0 / cntMolid);


                     // add labels for each protein molecule
                     var label = {}; // Each label contains 'position', 'text', 'color', 'background'

                     var position = new THREE.Vector3();
                     position.x = centerMolid.x;
                     position.y = centerMolid.y;
                     position.z = centerMolid.z;

                     label.position = position;

                     var chain = molid2chain[i];
                     label.text = chain.substr(chain.indexOf('_') + 1);
                     label.size = labelsize;
                     label.color = molid2color[i];
                     label.background = "#FFFFFF";

                     labels[i] = label;
                }
                me.icn3d.maxD = pmax.distanceTo(pmin);
                me.icn3d.center = psum.multiplyScalar(1.0 / cnt);

                // set the start and end of coils
                for(var i in molid2ss) {
                    // skip the first one since its end is the start of the first coil
                    for(var j = 1, jl = molid2ss[i].length; j < jl; ++j) {
                        var resiCoords = {};

                        resiCoords.type = 'coil';
                        resiCoords.startResi = molid2ss[i][j-1].endResi;
                        resiCoords.endResi = molid2ss[i][j].startResi;

                        resiCoords.coords = [];
                        resiCoords.coords.push(molid2ss[i][j-1].coords[1]);
                        resiCoords.coords.push(molid2ss[i][j].coords[0]);

                        //if(molid2ss[i] === undefined) molid2ss[i] = [];
                        molid2ss[i].push(resiCoords);
                    }
                }

                // sort the arrays
                //for(var i in molid2ss) {
                //    molid2ss[i].sort(function(a, b) {
                //        return parseFloat(a.startResi) - parseFloat(b.startResi);
                //    });
                //}

                // draw labels
                // there might be too many labels
                //me.options['labels'] = 'add labels';
                me.icn3d.savedLabels = labels;

                me.icn3d.molid2ss = molid2ss;
                me.icn3d.molid2color = molid2color;

                me.renderStructure(true);

                if(me.cfg.rotate !== undefined) me.rotateStructure(me.cfg.rotate, true);

                //if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();

                // show the dialog to select structures
                $( "#" + me.pre + "dl_filter_table" ).html(html);

                var title = "Select chains to display";

                var width = 250, height = (me.isMobile()) ? 'auto' : 200;

                var position = { my: "left top", at: "left+10 top+93", of: "#" + me.pre + "canvas", collision: "none" };

                window.dialog = $( "#" + me.pre + "dl_filter" ).dialog({
                  autoOpen: true,
                  title: title,
                  height: height,
                  width: width,
                  modal: false,
                  position: position
                });

                $(".ui-dialog .ui-button span")
                  .removeClass("ui-icon-closethick")
                  .addClass("ui-icon-close");

            }

            if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();

            if(data.atoms === undefined && data.molid2rescount === undefined) {
                alert('invalid MMDB data.');
                return false;
            }
          }
        });
    },

    downloadGi: function (gi) { var me = this;
        var mmdbid;

        // get mmdbid from gi
        var uri = "//eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=protein&db=structure&linkname=protein_structure&id=" + gi;

        me.icn3d.bCid = undefined;

        me.setLogCommand("load gi " + gi, false);

        $.ajax({
           url: uri,
           dataType: 'text',
           success: function(data) {
             if(data.indexOf('<Link>') === -1) {
               alert("There are no MMDB IDs available for the gi " + gi);
             }
             else {
               var linkStr = data.substr(data.indexOf('<Link>'));
               var start = linkStr.indexOf('<Id>');
               var end = linkStr.indexOf('</Id>');
               var mmdbid = linkStr.substr(start + 4, end - start - 4);

               me.downloadMmdb(mmdbid);
             }
           }
        });
    },

    loadAtomDataIn: function (data, id, type, seqalign) { var me = this;
        me.icn3d.init();

        var pmin = new THREE.Vector3( 9999, 9999, 9999);
        var pmax = new THREE.Vector3(-9999,-9999,-9999);
        var psum = new THREE.Vector3();

        var atoms = data.atoms;

        var serial = 0;
        var prevResi = 0;

        var serial2structure = {}; // for "align" only
        var mmdbid2pdbid = {}; // for "align" only

        me.pmid = data.pubmedid;

        if(type === 'align') {
          //serial2structure
          for (var i = 0, il = data.aligned_structures.length; i < il; ++i) {
              var structure = data.aligned_structures[i];

              if(i === 1) {
                  me.icn3d.secondId = structure.pdbid; // set the second pdbid to add indent in the structure and chain menus
                  //me.ALTERNATE_STRUCTURE = me.icn3d.secondId;
              }

              for(var j = structure.range[0]; j <= structure.range[1]; ++j) {
                  var pdbidTmp = structure.pdbid;
                  var mmdbidTmp = structure.mmdbid;
                  serial2structure[j] = pdbidTmp.toString();
                  mmdbid2pdbid[mmdbidTmp] = pdbidTmp;
              }
          }
        }

        var molid2chain = {}; // for "mmdbid"
        var pdbid_molid2chain = {}; // for "align"
        if(type === 'mmdbid' || type === 'align') {
          //molid2chain
          if(type === 'mmdbid') {
              if(data.molid2chain !== undefined) {
                  for (var molid in data.molid2chain) {
                      molid2chain[molid] = data.molid2chain[molid].chain;
                  }
              }
          }
          else if(type === 'align') {
              if(data.molid2chain !== undefined) {
                  for (var mmdbid in data.molid2chain) {
                    for (var molid in data.molid2chain[mmdbid]) {
                      pdbid_molid2chain[mmdbid2pdbid[mmdbid] + '_' + molid] = data.molid2chain[mmdbid][molid].chain;
                      }
                  }
              }
          }
        }

        var atomid2serial = {};
        var prevStructureNum = '', prevChainNum = '', prevResidueNum = '';
        var structureNum = '', chainNum = '', residueNum = '';
        for (var i in atoms) {
            ++serial;

            atomid2serial[i] = serial;

            var atm = atoms[i];
            atm.serial = serial;

            var mmdb_id;

            if(type === 'mmdbid' || type === 'mmcif') {
              mmdb_id = id; // here mmdb_id is pdbid or mmcif id
            }
            else if(type === 'align') {
              mmdb_id = serial2structure[serial]; // here mmdb_id is pdbid
            }

            if(atm.chain === undefined && (type === 'mmdbid' || type === 'align')) {
                if(type === 'mmdbid') {
                  var molid = atm.ids.m;
                  atm.chain = (molid2chain[molid] === undefined) ? 'Misc' : molid2chain[molid];
                }
                else if(type === 'align') {
                  var molid = atm.ids.m;
                  atm.chain = (pdbid_molid2chain[mmdb_id + '_' + molid] === undefined) ? 'Misc' : pdbid_molid2chain[mmdb_id + '_' + molid];
                }
            }
            else {
              atm.chain = (atm.chain === '') ? 'Misc' : atm.chain;
            }

            atm.resi = parseInt(atm.resi); // has to be integer

            if(atm.color !== undefined) atm.color = new THREE.Color(atm.color);
            atm.coord = new THREE.Vector3(atm.coord.x, atm.coord.y, atm.coord.z);

            // mmcif has pre-assigned structure in mmcifparser.cgi output
            if(type === 'mmdbid' || type === 'align') {
                atm.structure = mmdb_id;
            }

            var secondarys = '-';
            if(atm.ss === 'helix') {
                secondarys = 'H';
            }
            else if(atm.ss === 'sheet') {
                secondarys = 'E';
            }
            else if(!atm.het) {
                secondarys = 'C';
            }

            me.icn3d.secondarys[atm.structure + '_' + atm.chain + '_' + atm.resi] = secondarys;

            pmin.min(atm.coord);
            pmax.max(atm.coord);
            psum.add(atm.coord);

            if (atm.mt === 'p' || atm.mt === 'n')
            {
                if (atm.mt === 'p') {
                  me.icn3d.peptides[serial] = 1;

                  if (atm.name === 'CA') me.icn3d.calphas[serial] = 1;
                }
                else if (atm.mt === 'n') {
                  me.icn3d.nucleotides[serial] = 1;

                  if (atm.name == 'P') me.icn3d.nucleotidesP[serial] = 1;
                }

                me.icn3d.het = false;
            }
            else if (atm.mt === 's') { // solvent
              me.icn3d.water[serial] = 1;

              me.icn3d.het = true;
            }
            else if (atm.mt === 'l') { // ligands and ions
              me.icn3d.ligands[serial] = 1;

              if (atm.bonds.length === 0) me.icn3d.ions[serial] = 1;

              me.icn3d.het = true;
            }

            // double check
            if (atm.resn == 'HOH') me.icn3d.water[serial] = 1

            me.icn3d.atoms[serial] = atm;
            me.icn3d.displayAtoms[serial] = 1;
            me.icn3d.highlightAtoms[serial] = 1;

            // chain level
            var chainid = atm.structure + '_' + atm.chain;
            if (me.icn3d.chains[chainid] === undefined) me.icn3d.chains[chainid] = {};
            me.icn3d.chains[chainid][serial] = 1;

            // residue level
            var residueid = atm.structure + '_' + atm.chain + '_' + atm.resi;
            if (me.icn3d.residues[residueid] === undefined) me.icn3d.residues[residueid] = {};
            me.icn3d.residues[residueid][serial] = 1;

            structureNum = atm.structure;
            chainNum = structureNum + '_' + atm.chain;
            residueNum = chainNum + '_' + atm.resi;

            // different residue
            if(residueNum !== prevResidueNum) {
                // different chain
                if(chainNum !== prevChainNum) {
                    if(serial !== 1) {
                        if(me.icn3d.structures[prevStructureNum] === undefined) me.icn3d.structures[prevStructureNum] = [];
                        me.icn3d.structures[prevStructureNum].push(prevChainNum);
                    }
                }
            }

            var oneLetterRes = me.icn3d.residueName2Abbr(atm.resn.substr(0, 3));

            me.icn3d.residueId2Name[residueid] = oneLetterRes;

            if(atm.resi != prevResi) {
              if(me.icn3d.chainsSeq[chainid] === undefined) me.icn3d.chainsSeq[chainid] = [];
              if(me.icn3d.chainsAnno[chainid] === undefined ) me.icn3d.chainsAnno[chainid] = [];
              if(me.icn3d.chainsAnno[chainid][0] === undefined ) me.icn3d.chainsAnno[chainid][0] = [];
              if(me.icn3d.chainsAnno[chainid][1] === undefined ) me.icn3d.chainsAnno[chainid][1] = [];
              if(me.icn3d.chainsAnnoTitle[chainid] === undefined ) me.icn3d.chainsAnnoTitle[chainid] = [];
              if(me.icn3d.chainsAnnoTitle[chainid][0] === undefined ) me.icn3d.chainsAnnoTitle[chainid][0] = [];
              if(me.icn3d.chainsAnnoTitle[chainid][1] === undefined ) me.icn3d.chainsAnnoTitle[chainid][1] = [];

              var resObject = {};
              resObject.resi = atm.resi;
              resObject.name = oneLetterRes;

              var numberStr = '';
              if(atm.resi % 10 === 0) numberStr = atm.resi.toString();

              me.icn3d.chainsSeq[chainid].push(resObject);
              me.icn3d.chainsAnno[chainid][0].push(numberStr);
              me.icn3d.chainsAnno[chainid][1].push(secondarys);
              me.icn3d.chainsAnnoTitle[chainid][0].push('');
              me.icn3d.chainsAnnoTitle[chainid][1].push('SS');

              if(type === 'mmdbid' || type === 'align') {
                    me.icn3d.chainsColor[chainid] = atm.color;
              }
            }

            prevResi = atm.resi;

            prevStructureNum = structureNum;
            prevChainNum = chainNum;
            prevResidueNum = residueNum;
        }

        // remove the reference
        data.atoms = {};

        // add the last residue set
        if(me.icn3d.structures[structureNum] === undefined) me.icn3d.structures[structureNum] = [];
        me.icn3d.structures[structureNum].push(chainNum);

        // update bonds info
        if(type !== 'mmcif') {
        for (var i in me.icn3d.atoms) {
            var bondLength = (me.icn3d.atoms[i].bonds === undefined) ? 0 : me.icn3d.atoms[i].bonds.length;

            for(var j = 0; j < bondLength; ++j) {
                me.icn3d.atoms[i].bonds[j] = atomid2serial[me.icn3d.atoms[i].bonds[j]];
            }
        }
        }

        me.icn3d.cnt = serial;

        me.icn3d.pmin = pmin;
        me.icn3d.pmax = pmax;
        me.icn3d.maxD = pmax.distanceTo(pmin);
        me.icn3d.center = psum.multiplyScalar(1.0 / me.icn3d.cnt);

        if (me.icn3d.maxD < 25) me.icn3d.maxD = 25;

        // set up sequence alignment
        if(type === 'align' && seqalign !== undefined) {
          //loadSeqAlignment
          for (var i = 0, il = seqalign.length; i < il; ++i) {
              // first sequence
              var alignData = seqalign[i][0];
              var mmdbid1 = data.aligned_structures[0].pdbid;
              var molid1 = alignData.mid;

              var chain1 = pdbid_molid2chain[mmdbid1 + '_' + molid1];
              var chainid1 = mmdbid1 + '_' + chain1;

              var id2aligninfo = {};
              var start = alignData.mseq.length, end = -1;
              for(var j = 0, jl = alignData.mseq.length; j < jl; ++j) {
                  // 0: internal resi id, 1: pdb resi id, 2: resn, 3: aligned or not
                  //var id = alignData.mseq[j][0];
                  var resi = alignData.mseq[j][1];
                  var resn = (alignData.mseq[j][2] === '~') ? '-' : alignData.mseq[j][2];
                  var aligned = alignData.mseq[j][3]; // 0 or 1

                  if(aligned == 1) {
                      if(j < start) start = j;
                      if(j > end) end = j;
                  }

                  id2aligninfo[j] = {"resi": resi, "resn": resn, "aligned": aligned};
              }

              // second sequence
              alignData = seqalign[i][1];
              var mmdbid2 = data.aligned_structures[1].pdbid;
              var molid2 = alignData.sid;

              var chain2 = pdbid_molid2chain[mmdbid2 + '_' + molid2];
              var chainid2 = mmdbid2 + '_' + chain2;

              // annoation title for the master seq only
              if(me.icn3d.alignChainsAnnoTitle[chainid1] === undefined ) me.icn3d.alignChainsAnnoTitle[chainid1] = [];
              if(me.icn3d.alignChainsAnnoTitle[chainid1][0] === undefined ) me.icn3d.alignChainsAnnoTitle[chainid1][0] = [];
              if(me.icn3d.alignChainsAnnoTitle[chainid1][1] === undefined ) me.icn3d.alignChainsAnnoTitle[chainid1][1] = [];
              if(me.icn3d.alignChainsAnnoTitle[chainid1][2] === undefined ) me.icn3d.alignChainsAnnoTitle[chainid1][2] = [];
              if(me.icn3d.alignChainsAnnoTitle[chainid1][3] === undefined ) me.icn3d.alignChainsAnnoTitle[chainid1][3] = [];
              if(me.icn3d.alignChainsAnnoTitle[chainid1][4] === undefined ) me.icn3d.alignChainsAnnoTitle[chainid1][4] = [];
              if(me.icn3d.alignChainsAnnoTitle[chainid1][5] === undefined ) me.icn3d.alignChainsAnnoTitle[chainid1][5] = [];
              if(me.icn3d.alignChainsAnnoTitle[chainid1][6] === undefined ) me.icn3d.alignChainsAnnoTitle[chainid1][6] = [];

              // two annotations without titles
              me.icn3d.alignChainsAnnoTitle[chainid1][0].push("SS");
              me.icn3d.alignChainsAnnoTitle[chainid1][1].push("");
              me.icn3d.alignChainsAnnoTitle[chainid1][2].push("");
              // empty line
              me.icn3d.alignChainsAnnoTitle[chainid1][3].push("");
              // 2nd chain title
              me.icn3d.alignChainsAnnoTitle[chainid1][4].push(chainid2);
              // master chain title
              me.icn3d.alignChainsAnnoTitle[chainid1][5].push(chainid1);
              // empty line
              me.icn3d.alignChainsAnnoTitle[chainid1][6].push("");

              var alignIndex = 1;
              //for(var j = 0, jl = alignData.sseq.length; j < jl; ++j) {
              for(var j = start; j <= end; ++j) {
                  // 0: internal resi id, 1: pdb resi id, 2: resn, 3: aligned or not
                  //var id = alignData.sseq[j][0];
                  var resi = alignData.sseq[j][1];
                  var resn = (alignData.sseq[j][2] === '~') ? '-' : alignData.sseq[j][2];
                  var aligned = id2aligninfo[j].aligned + alignData.sseq[j][3]; // 0 or 2

                  var color;
                  if(aligned === 2) { // aligned
                      if(id2aligninfo[j].resn === resn) {
                          color = '#F00';
                      }
                      else {
                          color = '#00F';
                      }
                  }
                  else {
                      color = '#CCC';
                  }

                  // chain1
                  if(me.icn3d.alignChainsSeq[chainid1] === undefined) me.icn3d.alignChainsSeq[chainid1] = [];

                  var resObject = {};
                  resObject.mmdbid = mmdbid1;
                  resObject.chain = chain1;
                  resObject.resi = id2aligninfo[j].resi;
                  resObject.resn = id2aligninfo[j].resn;
                  resObject.aligned = aligned;
                  resObject.color = color;

                  me.icn3d.alignChainsSeq[chainid1].push(resObject);

                  if(!isNaN(id2aligninfo[j].resi)) {
                      if(me.icn3d.alignChains[chainid1] === undefined) me.icn3d.alignChains[chainid1] = {};
                      $.extend(me.icn3d.alignChains[chainid1], me.icn3d.residues[chainid1 + '_' + id2aligninfo[j].resi] );
                  }

                  // chain2
                  if(me.icn3d.alignChainsSeq[chainid2] === undefined) me.icn3d.alignChainsSeq[chainid2] = [];

                  resObject = {};
                  resObject.mmdbid = mmdbid2;
                  resObject.chain = chain2;
                  resObject.resi = resi;
                  resObject.resn = resn;
                  resObject.aligned = aligned;
                  resObject.color = color;

                  me.icn3d.alignChainsSeq[chainid2].push(resObject);

                  if(!isNaN(resi)) {
                      if(me.icn3d.alignChains[chainid2] === undefined) me.icn3d.alignChains[chainid2] = {};
                      $.extend(me.icn3d.alignChains[chainid2], me.icn3d.residues[chainid2 + '_' + resi] );
                  }

                  // annotation is for the master seq only
                  if(me.icn3d.alignChainsAnno[chainid1] === undefined ) me.icn3d.alignChainsAnno[chainid1] = [];
                  if(me.icn3d.alignChainsAnno[chainid1][0] === undefined ) me.icn3d.alignChainsAnno[chainid1][0] = [];
                  if(me.icn3d.alignChainsAnno[chainid1][1] === undefined ) me.icn3d.alignChainsAnno[chainid1][1] = [];
                  if(me.icn3d.alignChainsAnno[chainid1][2] === undefined ) me.icn3d.alignChainsAnno[chainid1][2] = [];
                  if(j === start) {
                      // empty line
                      if(me.icn3d.alignChainsAnno[chainid1][3] === undefined ) me.icn3d.alignChainsAnno[chainid1][3] = [];
                      // 2nd chain title
                      if(me.icn3d.alignChainsAnno[chainid1][4] === undefined ) me.icn3d.alignChainsAnno[chainid1][4] = [];
                      // master chain title
                      if(me.icn3d.alignChainsAnno[chainid1][5] === undefined ) me.icn3d.alignChainsAnno[chainid1][5] = [];
                      // empty line
                      if(me.icn3d.alignChainsAnno[chainid1][6] === undefined ) me.icn3d.alignChainsAnno[chainid1][6] = [];

                      me.icn3d.alignChainsAnno[chainid1][3].push('');
                      me.icn3d.alignChainsAnno[chainid1][4].push(me.icn3d.pdbid_chain2title[chainid2]);
                      me.icn3d.alignChainsAnno[chainid1][5].push(me.icn3d.pdbid_chain2title[chainid1]);
                      me.icn3d.alignChainsAnno[chainid1][6].push('');
                    }

                  var residueid = chainid1 + '_' + id2aligninfo[j].resi;
                  var ss = me.icn3d.secondarys[residueid];
                  me.icn3d.alignChainsAnno[chainid1][0].push(ss);

                  var symbol = '.';
                  if(alignIndex % 5 === 0) symbol = '*';
                  if(alignIndex % 10 === 0) symbol = '|';
                  me.icn3d.alignChainsAnno[chainid1][1].push(symbol); // symbol: | for 10th, * for 5th, . for rest

                  var numberStr = '';
                  if(alignIndex % 10 === 0) numberStr = alignIndex.toString();
                  me.icn3d.alignChainsAnno[chainid1][2].push(numberStr); // symbol: 10, 20, etc, empty for rest

                  ++alignIndex;
              } // end for(var j
          } // end for(var i
          seqalign = {};
        } // if(align

        data = {};
    },

    getStructureSelections: function (bInitial, moleculeArray) { var me = this;
      var html = "";

      var selected = bInitial ? " selected" : "";

      var keys = Object.keys(me.icn3d.structures).sort();

      for(var i in keys) {
          var molecule = keys[i];

          if(moleculeArray !== undefined) {
              selected = (moleculeArray.indexOf(molecule) !== -1) ? " selected" : "";
          }

          var indent = (me.icn3d.secondId !== undefined && molecule.indexOf(me.icn3d.secondId) === 0) ? '&nbsp;&nbsp;&nbsp;' : '';
          html += "<option value='" + molecule + "'" + selected + ">" + indent + keys[i] + "</option>";

          if(selected === " selected") {
              for(var j in me.icn3d.structures[molecule]) {
                  var chain = me.icn3d.structures[molecule][j];

                  me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.chains[chain]);
              }
            }
      }

      return html;
    },

    getChainSelections: function (bInitial, moleculeArray) { var me = this;
      var html = "";

      var selected = bInitial ? " selected" : "";

      if(moleculeArray === undefined) {
        for(var chain in me.icn3d.chains) {
            var indent = (me.icn3d.secondId !== undefined && chain.indexOf(me.icn3d.secondId) === 0) ? '&nbsp;&nbsp;&nbsp;' : '';
            html += "<option value='" + chain + "' " + selected + ">" + indent + chain + "</option>";

            me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.chains[chain]);
        }
      }
      else {
        for(var chain in me.icn3d.chains) {
          var dashPos = chain.indexOf('_');
          var molecule = chain.substr(0, dashPos);

          var indent = (me.icn3d.secondId !== undefined && chain.indexOf(me.icn3d.secondId) === 0) ? '&nbsp;&nbsp;&nbsp;' : '';

          if(moleculeArray !== null && moleculeArray.toString().toLowerCase().indexOf(molecule.toLowerCase()) !== -1) {
            html += "<option value='" + chain + "' selected>" + indent + chain + "</option>";

            me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.chains[chain]);
          }
          else {
            html += "<option value='" + chain + "'>" + indent + chain + "</option>";
          }
        }
      }

      return html;
    },

    getAlignChainSelections: function() { var me = this;
      var html = "";

        for(var chain in me.icn3d.alignChains) {
            var indent = (me.icn3d.secondId !== undefined && chain.indexOf(me.icn3d.secondId) === 0) ? '&nbsp;&nbsp;&nbsp;' : '';

            html += "<option value='" + chain + "'>" + indent + chain + "</option>";

            me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.alignChains[chain]);
        }

      return html;
    },

    getResidueSelections: function (commandname) { var me = this;
      var html = "";

      var bSelected = false;
      for(var i in me.icn3d.definedNames2Residues) {
          if(i === commandname) {
            html += "<option value='" + i + "' selected='selected'>" + i + "</option>";
            bSelected = true;
          }
          else {
            html += "<option value='" + i + "'>" + i + "</option>";
          }
      }

      if(bSelected) {
          $("#" + me.pre + "chainid").val("");
          $("#" + me.pre + "structureid").val("");

          $("#" + me.pre + "chainid2").val("");
          $("#" + me.pre + "structureid2").val("");
      }

      return html;
    },

    getAtomSelections: function (commandname) { var me = this;
      var html = "";

      var bSelected = false;
      for(var i in me.icn3d.definedNames2Atoms) {
          if(i === commandname) {
            html += "<option value='" + i + "' selected='selected'>" + i + "</option>";
            bSelected = true;
          }
          else {
            html += "<option value='" + i + "'>" + i + "</option>";
          }
      }

      if(bSelected) {
          $("#" + me.pre + "chainid").val("");
          $("#" + me.pre + "structureid").val("");

          $("#" + me.pre + "chainid2").val("");
          $("#" + me.pre + "structureid2").val("");
      }

      return html;
    },

    getSequencesAnnotations: function (chainArray, bUpdateHighlightAtoms, residueArray) { var me = this;
      var sequencesHtml = (me.icn3d.moleculeTitle === "") ? "<b>Sequences with coordinates:</b>" : "<b>Sequences of " + me.icn3d.moleculeTitle + " with coordinates: </b>";
      sequencesHtml += " (click to select, click again to deselect, click <button style='white-space:nowrap;' class='" + me.pre + "stopselection'>Stop Selection</button> to stop the current selection)<br/><br/>";

      var maxSeqCnt = 0;
      for(var i in chainArray) {
          i = chainArray[i];

          if(bUpdateHighlightAtoms === undefined || bUpdateHighlightAtoms) {
              me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.chains[i]);
          }

          var resiHtmlArray = [], seqHtml = "";
          var seqLength = (me.icn3d.chainsSeq[i] !== undefined) ? me.icn3d.chainsSeq[i].length : 0;

          if(seqLength > maxSeqCnt) maxSeqCnt = seqLength;

          var dashPos = i.indexOf('_');
          var structure = i.substr(0, dashPos);
          var chain = i.substr(dashPos + 1);

          //seqHtml += "<span class='residueNum' title='starting residue number'>" + me.icn3d.chainsAnno[i][0][0] + "</span>";
          seqHtml += "<span class='residueNum' title='starting residue number'>" + me.icn3d.chainsSeq[i][0].resi + "</span>";

          var maxResi = parseInt(me.icn3d.chainsSeq[i][0].resi);
          for(var k=0, kl=seqLength; k < kl; ++k) {
            var resiId = structure + "_" + chain + "_" + me.icn3d.chainsSeq[i][k].resi;

            var classForAlign = "class='residue'"; // used to identify a residue when clicking a residue in sequence

            if(residueArray !== undefined && residueArray.indexOf(resiId) !== -1) {
                classForAlign = "class='residue highlightSeq'";
            }

            var residueName = (me.icn3d.chainsSeq[i][k].name.length === 1) ? me.icn3d.chainsSeq[i][k].name : me.icn3d.chainsSeq[i][k].name.trim().substr(0, 1).toLowerCase();

            //seqHtml += "<span id='" + me.pre + structure + "_" + chain + "_" + me.icn3d.chainsSeq[i][k].resi + "' " + classForAlign + " title='Structure " + structure + ", Chain " + chain + ", Residue " + me.icn3d.chainsSeq[i][k].name + me.icn3d.chainsSeq[i][k].resi + "'>" + residueName + "</span>";
            seqHtml += "<span id='" + me.pre + structure + "_" + chain + "_" + me.icn3d.chainsSeq[i][k].resi + "' " + classForAlign + ">" + residueName + "</span>";

            if(maxResi < parseInt(me.icn3d.chainsSeq[i][k].resi)) {
                maxResi = parseInt(me.icn3d.chainsSeq[i][k].resi);
            }
          }

          //seqHtml += "<span class='residueNum' title='ending residue number'>" + me.icn3d.chainsAnno[i][0][seqLength-1] + "</span>";
          //seqHtml += "<span class='residueNum' title='ending residue number'>" + me.icn3d.chainsSeq[i][seqLength-1].resi + "</span>";
          seqHtml += "<span class='residueNum' title='ending residue number'>" + maxResi + "</span>";

          var annoLength = (me.icn3d.chainsAnno[i] !== undefined) ? me.icn3d.chainsAnno[i].length : 0;

          for(var j=0, jl=annoLength; j < jl; ++j) {
            resiHtmlArray[j] = "";

            resiHtmlArray[j] += "<span class='residueNum'></span>"; // a spot corresponding to the starting and ending residue number
            for(var k=0, kl=me.icn3d.chainsAnno[i][j].length; k < kl; ++k) {
              var text = me.icn3d.chainsAnno[i][j][k];

              resiHtmlArray[j] += "<span>" + text + "</span>";
            }
            resiHtmlArray[j] += "<span class='residueNum'></span>"; // a spot corresponding to the starting and ending residue number
          }

          for(var j=0, jl=annoLength; j < jl; ++j) {
            //sequencesHtml += "<div class='residueLine' style='white-space:nowrap;'><div class='seqTitle' chain='" + i + "' anno='" + j + "'>" + me.icn3d.chainsAnnoTitle[i][j][0] + " </div>" + resiHtmlArray[j] + "<br/></div>";
            sequencesHtml += "<div class='residueLine' style='white-space:nowrap;'><div class='annoTitle' chain='" + i + "' anno='" + j + "'>" + me.icn3d.chainsAnnoTitle[i][j][0] + " </div>" + resiHtmlArray[j] + "<br/></div>";
          }

          var color = (me.icn3d.chainsColor[i] !== undefined) ? '#' + me.icn3d.chainsColor[i].getHexString() : '#000000';

          var chainidTmp = i; title = (me.icn3d.pdbid_chain2title !== undefined) ? me.icn3d.pdbid_chain2title[i] : '';

          sequencesHtml += '<div class="seqTitle" chain="' + i + '" anno="sequence" style="color:' + color + '" title="' + title + '">' + chainidTmp + ' </div><span class="seqLine" style="color:' + color + '">' + seqHtml + '</span><br/>';
      }

      return {"sequencesHtml": sequencesHtml, "maxSeqCnt":maxSeqCnt};
    },

    getAlignSequencesAnnotations: function (alignChainArray, bUpdateHighlightAtoms) { var me = this;
      var sequencesHtml = "<b>Aligned Sequences:</b>";
      sequencesHtml += " (click to select, click again to deselect, click <button style='white-space:nowrap;' class='" + me.pre + "stopselection'>Stop Selection</button> to stop the current selection)<br/><br/>";

      var maxSeqCnt = 0;

      for(var i in alignChainArray) {
          i = alignChainArray[i];

          if(bUpdateHighlightAtoms === undefined || bUpdateHighlightAtoms) {
              me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.alignChains[i]);
          }

          var resiHtmlArray = [], seqHtml = "";
          var seqLength = (me.icn3d.alignChainsSeq[i] !== undefined) ? me.icn3d.alignChainsSeq[i].length : 0;

          if(seqLength > maxSeqCnt) maxSeqCnt = seqLength;

          var dashPos = i.indexOf('_');
          var structure = i.substr(0, dashPos);
          var chain = i.substr(dashPos + 1);

          seqHtml += "<span class='residueNum' title='starting residue number'>" + me.icn3d.alignChainsSeq[i][0].resi + "</span>";
          for(var k=0, kl=seqLength; k < kl; ++k) {
            // resiId is empty if it's gap
            var resiId = 'N/A', resIdFull = '', color = '#000';
            if(!isNaN(me.icn3d.alignChainsSeq[i][k].resi)) {
                resiId = me.icn3d.alignChainsSeq[i][k].resi;
                resIdFull = me.pre + structure + "_" + chain + "_" + resiId;
                color = me.icn3d.alignChainsSeq[i][k].color;
            }

            var classForAlign = "class='residue'"; // used to identify a residue when clicking a residue in sequence
            if(me.icn3d.alignChainsSeq[i][k].aligned === 2) classForAlign = "class='residue alignSeq'";

            //seqHtml += "<span id='" + resIdFull + "' " + classForAlign + " title='Structure " + structure + ", Chain " + chain + ", Residue " + resiId + "' style='color:" + color + "'>" + me.icn3d.alignChainsSeq[i][k].resn + "</span>";
            seqHtml += "<span id='" + resIdFull + "' " + classForAlign + " style='color:" + color + "'>" + me.icn3d.alignChainsSeq[i][k].resn + "</span>";
          }
          seqHtml += "<span class='residueNum' title='ending residue number'>" + me.icn3d.alignChainsSeq[i][seqLength-1].resi + "</span>";

          var annoLength = (me.icn3d.alignChainsAnno[i] !== undefined) ? me.icn3d.alignChainsAnno[i].length : 0;

          for(var j=0, jl=annoLength; j < jl; ++j) {
            resiHtmlArray[j] = "";

            resiHtmlArray[j] += "<span class='residueNum'></span>"; // a spot corresponding to the starting and ending residue number
            for(var k=0, kl=me.icn3d.alignChainsAnno[i][j].length; k < kl; ++k) {
              resiHtmlArray[j] += "<span>" + me.icn3d.alignChainsAnno[i][j][k] + "</span>";
            }
            resiHtmlArray[j] += "<span class='residueNum'></span>"; // a spot corresponding to the starting and ending residue number
          }

          var color = (me.icn3d.chainsColor[i] !== undefined) ? '#' + me.icn3d.chainsColor[i].getHexString() : '#000000';

          var chainidTmp = i, title = (me.icn3d.pdbid_chain2title !== undefined) ? me.icn3d.pdbid_chain2title[i] : '';

          // add markers and residue numbers
          for(var j=annoLength-1; j >= 0; --j) {
            sequencesHtml += "<div class='residueLine' style='white-space:nowrap;'><div class='seqTitle' chain='" + i + "' anno='" + j + "'>" + me.icn3d.alignChainsAnnoTitle[i][j][0] + "</div>" + resiHtmlArray[j] + "<br/></div>";
          }

          sequencesHtml += '<div class="seqTitle" chain="' + i + '" anno="sequence" style="color:' + color + '" title="' + title + '">' + chainidTmp + ' </div><span class="seqLine" style="color:' + color + '">' + seqHtml + '</span><br/>';
      }

      return {"sequencesHtml": sequencesHtml, "maxSeqCnt":maxSeqCnt};
    },

    addCustomSelection: function (residueArray, atomArray, commandname, commanddesc, select, bSelectResidues) { var me = this;
       // if selecting residues, show both in "sequence" and "command" dialogs
       // if selecting atoms (not full residues), show just in "command" dialog
       if(!(commandname in me.icn3d.definedNames2Residues) ) {
         if(bSelectResidues) {
           me.icn3d.definedNames2Residues[commandname] = residueArray;
         }

         me.icn3d.definedNames2Atoms[commandname] = atomArray;
         me.icn3d.definedNames2Descr[commandname] = commanddesc;
         me.icn3d.definedNames2Command[commandname] = select;

         var definedResiduesHtml = me.getResidueSelections(commandname);
         var definedAtomsHtml = me.getAtomSelections(commandname);

         $("#" + me.pre + "customResidues").html(definedResiduesHtml);
         $("#" + me.pre + "customResidues2").html(definedResiduesHtml);
         $("#" + me.pre + "customAtoms").html(definedAtomsHtml);
       }
       else { // concatenate the residues
         if(bSelectResidues) {
           me.icn3d.definedNames2Residues[commandname] = me.icn3d.definedNames2Residues[commandname].concat(residueArray);
         }

         me.icn3d.definedNames2Atoms[commandname] = me.icn3d.definedNames2Atoms[commandname].concat(atomArray);
         me.icn3d.definedNames2Descr[commandname] = commanddesc;
         me.icn3d.definedNames2Command[commandname] = select;

         var definedResiduesHtml = me.getResidueSelections(commandname);
         var definedAtomsHtml = me.getAtomSelections(commandname);

         $("#" + me.pre + "customResidues").html(definedResiduesHtml);
         $("#" + me.pre + "customResidues2").html(definedResiduesHtml);
         $("#" + me.pre + "customAtoms").html(definedAtomsHtml);
       }
    },

    changeStructureid: function (moleculeArray) { var me = this;
       me.icn3d.removeHighlightObjects();

       me.icn3d.highlightAtoms = {};

       // reset alternate structure
       me.ALTERNATE_STRUCTURE = Object.keys(me.icn3d.structures).indexOf(moleculeArray[0]);

       // clear custom defined residues
       $("#" + me.pre + "chainid").val("");
       $("#" + me.pre + "alignChainid").val("");
       $("#" + me.pre + "customResidues").val("");

       $("#" + me.pre + "chainid2").val("");
       $("#" + me.pre + "alignChainid2").val("");
       $("#" + me.pre + "customResidues2").val("");

       $("#" + me.pre + "customAtoms").val("");

       // log the selection
       if(moleculeArray !== null) me.setLogCommand('select molecule ' + moleculeArray.toString(), true);

       var chainsHtml = me.getChainSelections(false, moleculeArray);
       $("#" + me.pre + "chainid").html(chainsHtml);
       $("#" + me.pre + "chainid2").html(chainsHtml);

/*
       var chainArray = [];
       for(var chain in me.icn3d.chains) {
          var dashPos = chain.indexOf('_');
          var molecule = chain.substr(0, dashPos);

          if(moleculeArray.toString().toLowerCase().indexOf(molecule.toLowerCase()) !== -1) {
            chainArray.push(chain);
          }
       }

       var seqObj = me.getSequencesAnnotations(chainArray);
*/
       var residueArray = [];
       for(var residue in me.icn3d.residues) {
          var dashPos = residue.indexOf('_');
          var molecule = residue.substr(0, dashPos);

          if(moleculeArray.toString().toLowerCase().indexOf(molecule.toLowerCase()) !== -1) {
            residueArray.push(residue);
            me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.residues[residue]);
          }
       }

       var seqObj = me.getSequencesAnnotations(Object.keys(me.icn3d.chains), false, residueArray);

       $("#" + me.pre + "dl_sequence").html(seqObj.sequencesHtml);
       $("#" + me.pre + "dl_sequence").width(me.RESIDUE_WIDTH * seqObj.maxSeqCnt + 200);

       me.icn3d.addHighlightObjects();
    },

    changeChainid: function (chainArray) { var me = this;
       me.icn3d.removeHighlightObjects();

       me.icn3d.highlightAtoms = {};

       // clear custom defined residues;
       $("#" + me.pre + "structureid").val("");
       $("#" + me.pre + "alignChainid").val("");
       $("#" + me.pre + "customResidues").val("");

       $("#" + me.pre + "structureid2").val("");
       $("#" + me.pre + "alignChainid2").val("");
       $("#" + me.pre + "customResidues2").val("");

       $("#" + me.pre + "customAtoms").val("");

       // log the selection
       if(chainArray !== null) me.setLogCommand('select chain ' + chainArray.toString(), true);

       //var seqObj = me.getSequencesAnnotations(chainArray);

       var residueArray = [];
       for(var residue in me.icn3d.residues) {
          var dashPos = residue.lastIndexOf('_');
          var chain = residue.substr(0, dashPos);

          if(chainArray.toString().toLowerCase().indexOf(chain.toLowerCase()) !== -1) {
            residueArray.push(residue);
            me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.residues[residue]);
          }
       }

       var seqObj = me.getSequencesAnnotations(Object.keys(me.icn3d.chains), false, residueArray);

       $("#" + me.pre + "dl_sequence").html(seqObj.sequencesHtml);
       $("#" + me.pre + "dl_sequence").width(me.RESIDUE_WIDTH * seqObj.maxSeqCnt + 200);

       me.icn3d.addHighlightObjects();
    },

    changeResidueid: function (residueArray) { var me = this;
       me.icn3d.removeHighlightObjects();

       me.icn3d.highlightAtoms = {};

       // clear custom defined residues;
       $("#" + me.pre + "structureid").val("");
       $("#" + me.pre + "chainid").val("");
       $("#" + me.pre + "alignChainid").val("");
       $("#" + me.pre + "customResidues").val("");

       $("#" + me.pre + "structureid2").val("");
       $("#" + me.pre + "chainid2").val("");
       $("#" + me.pre + "alignChainid2").val("");
       $("#" + me.pre + "customResidues2").val("");

       $("#" + me.pre + "customAtoms").val("");

       // log the selection
       if(residueArray !== null) me.setLogCommand('select residue ' + residueArray.toString(), true);

       //var sequencesHtml += " (click to select, click again to deselect, click <button style='white-space:nowrap;' class='" + me.pre + "stopselection'>Stop Selection</button> to stop the current selection)<br/><br/>";
       var sequencesHtml = "";

       //var maxSeqCnt = 0;

         //if(residueArray.length > maxSeqCnt) maxSeqCnt = residueArray.length;

       for(var j = 0, jl = residueArray.length; j < jl; ++j) {
           me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.residues[residueArray[j]]);
       }

       sequencesHtml += "<b>Annotation(s):</b> Previously selected residues<br/>";

       var chainArray = [];
       for(var chain in me.icn3d.chains) {
           chainArray.push(chain);
       }

       var seqObj = me.getSequencesAnnotations(chainArray, false, residueArray);
       $("#" + me.pre + "dl_sequence").html(sequencesHtml + seqObj.sequencesHtml);
       $("#" + me.pre + "dl_sequence").width(me.RESIDUE_WIDTH * seqObj.maxSeqCnt + 200);

       me.icn3d.addHighlightObjects();
    },

    changeAlignChainid: function (alignChainArray) { var me = this;
       me.icn3d.removeHighlightObjects();

       me.icn3d.highlightAtoms = {};

       // clear custom defined residues;
       $("#" + me.pre + "structureid").val("");
       $("#" + me.pre + "chainid").val("");
       $("#" + me.pre + "customResidues").val("");

       $("#" + me.pre + "structureid2").val("");
       $("#" + me.pre + "chainid2").val("");
       $("#" + me.pre + "customResidues2").val("");

       $("#" + me.pre + "customAtoms").val("");

       // log the selection
       if(alignChainArray !== null) me.setLogCommand('select alignChain ' + alignChainArray.toString(), true);

       var seqObj = me.getAlignSequencesAnnotations(alignChainArray);
       $("#" + me.pre + "dl_sequence2").html(seqObj.sequencesHtml);
       $("#" + me.pre + "dl_sequence2").width(me.RESIDUE_WIDTH2 * seqObj.maxSeqCnt + 200);

       me.icn3d.addHighlightObjects();
    },

    showCustomResidues: function (nameArray) { var me = this;
       me.icn3d.removeHighlightObjects();

       me.icn3d.highlightAtoms = {};

       // clear molecule and chain
       $("#" + me.pre + "chainid").val("");
       $("#" + me.pre + "alignChainid").val("");
       $("#" + me.pre + "structureid").val("");

       $("#" + me.pre + "chainid2").val("");
       $("#" + me.pre + "alignChainid2").val("");
       $("#" + me.pre + "structureid2").val("");

       $("#" + me.pre + "customAtoms").val("");

       sequencesHtml += " (click to select, click again to deselect, click <button style='white-space:nowrap;' class='" + me.pre + "stopselection'>Stop Selection</button> to stop the current selection)<br/><br/>";
       var sequencesHtml = "";

       //var maxSeqCnt = 0;

       var annoTmp = '';
       var allResidues = {};
       for(var i = 0; i < nameArray.length; ++i) {
         var residueArray = me.icn3d.definedNames2Residues[nameArray[i]];

         if(residueArray === undefined) continue;

         //if(residueArray.length > maxSeqCnt) maxSeqCnt = residueArray.length;

         var residueTitle = me.icn3d.definedNames2Descr[nameArray[i]];

         annoTmp += "<b>" + nameArray[i] + ":</b> " + residueTitle + "; ";

         for(var j = 0, jl = residueArray.length; j < jl; ++j) {
           allResidues[residueArray[j]] = 1;
           me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.residues[residueArray[j]]);
         }
       } // outer for

       sequencesHtml += "<b>Annotation(s):</b> " + annoTmp + "<br/>";

       var chainArray = [];
       for(var chain in me.icn3d.chains) {
            chainArray.push(chain);
       }

       var seqObj = me.getSequencesAnnotations(chainArray, false, Object.keys(allResidues));
       $("#" + me.pre + "dl_sequence").html(sequencesHtml + seqObj.sequencesHtml);
       $("#" + me.pre + "dl_sequence").width(me.RESIDUE_WIDTH * seqObj.maxSeqCnt + 200);

       me.icn3d.addHighlightObjects();
    },

    showCustomAtoms: function (nameArray) { var me = this;
       me.icn3d.removeHighlightObjects();

       me.icn3d.highlightAtoms = {};

       // clear molecule and chain
       $("#" + me.pre + "chainid").val("");
       $("#" + me.pre + "alignChainid").val("");
       $("#" + me.pre + "structureid").val("");
       $("#" + me.pre + "customResidues").val("");

       $("#" + me.pre + "chainid2").val("");
       $("#" + me.pre + "alignChainid2").val("");
       $("#" + me.pre + "structureid2").val("");
       $("#" + me.pre + "customResidues2").val("");

       // clear commmand
       $("#" + me.pre + "command").val("");
       $("#" + me.pre + "command_name").val("");
       $("#" + me.pre + "command_desc").val("");

       sequencesHtml += " (click to select, click again to deselect, click <button style='white-space:nowrap;' class='" + me.pre + "stopselection'>Stop Selection</button> to stop the current selection)<br/><br/>";
       var sequencesHtml = "";

       //var maxSeqCnt = 0;

       var annoTmp = '';
       var allResidues = {};
       for(var i = 0; i < nameArray.length; ++i) {
         var atomArray = me.icn3d.definedNames2Atoms[nameArray[i]];

         var residueHash = {};
         for(var j = 0, jl = atomArray.length; j < jl; ++j) {
             var atom = me.icn3d.atoms[atomArray[j]];
             var residueid = atom.structure + '_' + atom.chain + '_' + atom.resi;
             residueHash[residueid] = 1;
         }

         var residueArray = Object.keys(residueHash);

         if(residueArray === undefined) continue;

         //if(residueArray.length > maxSeqCnt) maxSeqCnt = residueArray.length;

         var residueTitle = me.icn3d.definedNames2Descr[nameArray[i]];

         annoTmp += "<b>" + nameArray[i] + ":</b> " + residueTitle + "; ";

         for(var j = 0, jl = residueArray.length; j < jl; ++j) {
           allResidues[residueArray[j]] = 1;
           //me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.residues[residueArray[j]]);
         }
       } // outer for

       sequencesHtml += "<b>Annotation(s):</b> " + annoTmp + "<br/>";

       var chainArray = [];
       for(var chain in me.icn3d.chains) {
            chainArray.push(chain);
       }

       var seqObj = me.getSequencesAnnotations(chainArray, false, Object.keys(allResidues));
       $("#" + me.pre + "dl_sequence").html(sequencesHtml + seqObj.sequencesHtml);
       $("#" + me.pre + "dl_sequence").width(me.RESIDUE_WIDTH * seqObj.maxSeqCnt + 200);


     // fill the dialog
     me.icn3d.highlightAtoms = {};
     for(var i = 0; i < nameArray.length; ++i) {
       var atomArray = me.icn3d.definedNames2Atoms[nameArray[i]];
       var atomTitle = me.icn3d.definedNames2Descr[nameArray[i]];
       var atomCommand = me.icn3d.definedNames2Command[nameArray[i]];

       if(i === 0) {
         $("#" + me.pre + "command").val(atomCommand);
         $("#" + me.pre + "command_name").val(nameArray[i]);
         $("#" + me.pre + "command_desc").val(atomTitle);
       }
       else {
         var prevValue = $("#command").val();
         $("#" + me.pre + "command").val(prevValue + "; " + atomCommand);

         var prevValue = $("#command_name").val();
         $("#" + me.pre + "command_name").val(prevValue + "; " + nameArray[i]);

         var prevValue = $("#command_desc").val();
         $("#" + me.pre + "command_desc").val(prevValue + "; " + atomTitle);
       }

       for(var j = 0, jl = atomArray.length; j < jl; ++j) {
         me.icn3d.highlightAtoms[atomArray[j]] = 1;
       }

     } // outer for

       me.icn3d.addHighlightObjects();
    },

    showSelected: function (id) { var me = this;
       me.icn3d.displayAtoms = {};

       var chainArray = [];

       var chainArray1 = $("#" + me.pre + "chainid").val();
       var chainArray2 = $("#" + me.pre + "chainid2").val();
       if(chainArray1) chainArray = chainArray.concat(chainArray1);
       if(chainArray2) chainArray = chainArray.concat(chainArray2);

       if(chainArray) {
         for(var i in chainArray) {
           var chain = chainArray[i];

           me.icn3d.displayAtoms = me.icn3d.unionHash(me.icn3d.displayAtoms, me.icn3d.chains[chain]);
         } // outer for
       }

       chainArray = [];

       chainArray1 = $("#" + me.pre + "alignChainid").val();
       chainArray2 = $("#" + me.pre + "alignChainid2").val();
       if(chainArray1) chainArray = chainArray.concat(chainArray1);
       if(chainArray2) chainArray = chainArray.concat(chainArray2);

       if(chainArray) {
         for(var i in chainArray) {
           var chain = chainArray[i];

           me.icn3d.displayAtoms = me.icn3d.unionHash(me.icn3d.displayAtoms, me.icn3d.alignChains[chain]);
         } // outer for
       }

       if(id === me.pre + 'customAtoms' || id === me.pre + 'customResidues' || id === me.pre + 'customResidues2') {
           var nameArray = [];

           if(id === me.pre + 'customAtoms') {
               nameArray = $("#" + id).val();
           }
           else {
               var nameArray1 = $("#" + me.pre + "customResidues").val();
               var nameArray2 = $("#" + me.pre + "customResidues2").val();

               if(nameArray1) nameArray = nameArray.concat(nameArray1);
               if(nameArray2) nameArray = nameArray.concat(nameArray2);
           }

           if(nameArray) {
             for(var i in nameArray) {
               if(id === me.pre + 'customAtoms') {
                 var atomArray = me.icn3d.definedNames2Atoms[nameArray[i]];

                 for(var j in atomArray) {
                   me.icn3d.displayAtoms[atomArray[j]] = 1;
                 }
               }
               else if(id === me.pre + 'customResidues') {
                 var residueArray = me.icn3d.definedNames2Residues[nameArray[i]];

                 for(var j in residueArray) {
                   me.icn3d.displayAtoms = me.icn3d.unionHash(me.icn3d.displayAtoms, me.icn3d.residues[residueArray[j]]);
                 }
               }

             } // outer for
           }
       }

       var options2 = {};
       //show selected rotationcenter
       options2['rotationcenter'] = 'display center';

       me.icn3d.draw(options2);
    },

    selectResiduesAtoms: function (select, commandname, commanddesc) { var me = this;
       // selection definition is similar to Chimera: https://www.cgl.ucsf.edu/chimera/docs/UsersGuide/midas/frameatom_spec.html
       // semicolon-separated different seletions, which will be unioned
       var commandArray = select.replace(/\s/g, '').split(';');

       var residueArray = [];
       var atomArray = [];

       var bSelectResidues = true;
       for(var i = 0, il=commandArray.length; i < il; ++i) {
           //#1,2,3.A,B,C:5-10,LYS,ligands@CA,C
           // #1,2,3: Structure
           // .A,B,C: chain
           // :5-10,LYS,ligands: residues, could be 'peptides', 'nucleotides', 'ligands', 'ions', and 'water'
           // @CA,C: atoms
           // wild card * can be used to select all

           var poundPos = commandArray[i].indexOf('#');
           var periodPos = commandArray[i].indexOf('.');
           var colonPos = commandArray[i].indexOf(':');
           var atPos = commandArray[i].indexOf('@');

           var moleculeStr, chainStr, residueStr, atomStr;
           var testStr = commandArray[i];

           if(atPos === -1) {
             atomStr = "*";
             //testStr = testStr; // no change
           }
           else {
             atomStr = testStr.substr(atPos + 1);
             testStr = testStr.substr(0, atPos);
           }

           if(colonPos === -1) {
             residueStr = "*";
             //testStr = testStr; // no change
           }
           else {
             residueStr = testStr.substr(colonPos + 1);
             testStr = testStr.substr(0, colonPos);
           }

           if(periodPos === -1) {
             chainStr = "*";
             //testStr = testStr; // no change
           }
           else {
             chainStr = testStr.substr(periodPos + 1);
             testStr = testStr.substr(0, periodPos);
           }

           if(poundPos === -1) {
             moleculeStr = "*";
             //testStr = testStr; // no change
           }
           else {
             moleculeStr = testStr.substr(poundPos + 1);
             testStr = testStr.substr(0, poundPos);
           }

           if(atomStr !== '*') {
             bSelectResidues = false; // selected atoms
           }

           var molecule, chain, molecule_chain, moleculeArray=[], Molecule_ChainArray=[], start, end;

           if(moleculeStr === '*') {
             moleculeArray = Object.keys(me.icn3d.structures);
           }
           else {
             moleculeArray = moleculeStr.split(",")
           }

           if(chainStr === '*') {
             var tmpArray = Object.keys(me.icn3d.chains);  // 1_A (molecule_chain)
             for(var j in tmpArray) {
               molecule_chain = tmpArray[j];

               molecule = molecule_chain.substr(0, molecule_chain.indexOf('_'));
               if(moleculeArray.toString().toLowerCase().indexOf(molecule.toLowerCase()) !== -1) {
                 Molecule_ChainArray.push(molecule_chain);
               }
             }
           }
           else {
             for(var j in moleculeArray) {
               molecule = moleculeArray[j];

               var chainArray = chainStr.split(",");
               for(var k in chainArray) {
                 Molecule_ChainArray.push(molecule + '_' + chainArray[k]);
               }
             }
           }

           var residueStrArray = residueStr.split(',');
           for(var j in residueStrArray) {
               var bResidueId = false;

               var hyphenPos = residueStrArray[j].indexOf('-');

               var oneLetterResidue;
               var bAllResidues = false;

               if(hyphenPos !== -1) {
                 start = residueStrArray[j].substr(0, hyphenPos);
                 end = residueStrArray[j].substr(hyphenPos+1);
                 bResidueId = true;
               }
               else {
                 if(!isNaN(residueStrArray[j])) { // residue id
                   start = residueStrArray[j];
                   end = start;
                   bResidueId = true;
                 }
                 else if(residueStrArray[j] === '*') { // all resiues
                   bAllResidues = true;
                 }
                 else if(residueStrArray[j] !== 'peptides' && residueStrArray[j] !== 'nucleotides' && residueStrArray[j] !== 'ligands' && residueStrArray[j] !== 'ions' && residueStrArray[j] !== 'water') { // residue name
                   var tmpStr = residueStrArray[j].toUpperCase();
                   oneLetterResidue = (residueStrArray[j].length === 1) ? tmpStr : me.icn3d.residueName2Abbr(tmpStr);
                 }
               }

               var residueHashTmp = {};

               for(var mc in Molecule_ChainArray) {
                 molecule_chain = Molecule_ChainArray[mc];

                 if(bResidueId) {
                   for(var k = parseInt(start); k <= parseInt(end); ++k) {
                     var residueId = molecule_chain + '_' + k;
                     residueArray.push(residueId);

                     for(var m in me.icn3d.residues[residueId]) {
                       if(atomStr === '*' || atomStr === me.icn3d.atoms[m].name) {
//                         me.icn3d.highlightAtoms[m] = 1;
                         atomArray.push(m);
                       }
                     }
                   }
                 }
                 else {
                   if(molecule_chain in me.icn3d.chains) {
                     var atomHash = me.icn3d.chains[molecule_chain];
                     for(var m in atomHash) {
                       // residue could also be 'peptides', 'nucleotides', 'ligands', 'ions', and 'water'
                       var tmpStr = me.icn3d.atoms[m].resn.substr(0,3).toUpperCase();
                       if(bAllResidues
                           || me.icn3d.residueName2Abbr(tmpStr) === oneLetterResidue
                           || (residueStrArray[j] === 'peptides' && m in me.icn3d.peptides)
                           || (residueStrArray[j] === 'nucleotides' && m in me.icn3d.nucleotides)
                           || (residueStrArray[j] === 'ligands' && m in me.icn3d.ligands)
                           || (residueStrArray[j] === 'ions' && m in me.icn3d.ions)
                           || (residueStrArray[j] === 'water' && m in me.icn3d.water)
                           ) {
                         // many duplicates
                         residueHashTmp[molecule_chain + '_' + me.icn3d.atoms[m].resi] = 1;

                         if(atomStr === '*' || atomStr === me.icn3d.atoms[m].name) {
//                           me.icn3d.highlightAtoms[m] = 1;
                           atomArray.push(m);
                         }

                       }
                     }
                   }
                 }
               }

               for(var residueid in residueHashTmp) {
                 residueArray.push(residueid);
               }
           } // for (j
       }  // for (i

       if(commandname !== "") {
           me.addCustomSelection(residueArray, atomArray, commandname, commanddesc, select, bSelectResidues);

           var nameArray = [commandname];
           me.showCustomResidues(nameArray);
       }
    },

    pickCustomSphere: function (select, radius) {   var me = this; // me.icn3d.pickedatom is set already
       me.clearSelection();

        var atomlistTarget = {};
      for(var i in me.icn3d.highlightAtoms) {
        atomlistTarget[i] = me.icn3d.atoms[i];
      }

        var atoms = me.icn3d.getAtomsWithinAtom(me.icn3d.hash2Atoms(me.icn3d.displayAtoms), atomlistTarget, parseFloat(radius));

        var residues = {}, atomArray = [];

        for (var i in atoms) {
            var atom = atoms[i];
            var residueid = atom.structure + '_' + atom.chain + '_' + atom.resi;
            residues[residueid] = 1;

            atomArray.push(i);
        }

        var residueArray = Object.keys(residues);

        me.icn3d.highlightAtoms = {};
        for(var index in residueArray) {
          var residueid = residueArray[index];
          for(var i in me.icn3d.residues[residueid]) {
            //var atom = me.icn3d.atoms[i];
            //atom.color = new THREE.Color(0xFF0000);

            //me.icn3d.atomPrevColors[i] = atom.color;

            me.icn3d.highlightAtoms[i] = 1;
          }
        }

        var commandname, commanddesc;
          var firstAtom = me.icn3d.getFirstAtomObj(atomlistTarget);
          commandname = "sphere." + firstAtom.chain + ":" + me.icn3d.residueName2Abbr(firstAtom.resn.substr(0, 3)) + firstAtom.resi + "-" + $("#" + me.pre + "radius_aroundsphere").val() + "A";
          commanddesc = "select a sphere around currently selected " + Object.keys(me.icn3d.highlightAtoms).length + " atoms with a radius of " + radius + " angstrom";

        me.addCustomSelection(residueArray, atomArray, commandname, commanddesc, select, true);

        var nameArray = [commandname];

        me.showCustomResidues(nameArray);

        //me.icn3d.draw();

//    me.icn3d.picking = 0;
    },

    // between the highlighted and the rest atoms
    showHbonds: function (select, threshold) { var me = this;
        var options2 = {};
        options2["hbonds"] = "yes";

        //var peptidesnucleotides = me.icn3d.unionHash(me.icn3d.peptides, me.icn3d.nucleotides);
        //me.icn3d.calculateLigandHbonds(me.icn3d.intersectHash2Atoms(me.icn3d.displayAtoms, peptidesnucleotides), me.icn3d.intersectHash2Atoms(me.icn3d.displayAtoms, me.icn3d.ligands), parseFloat(threshold) );
       var complement = {};

       for(var i in me.icn3d.atoms) {
           if(!me.icn3d.highlightAtoms.hasOwnProperty(i) && me.icn3d.displayAtoms.hasOwnProperty(i)) {
               complement[i] = me.icn3d.atoms[i];
           }
       }


        var firstAtom = me.icn3d.getFirstAtomObj(me.icn3d.highlightAtoms);

        if(Object.keys(complement).length > 0 && Object.keys(me.icn3d.highlightAtoms).length > 0) {
            me.icn3d.calculateLigandHbonds(complement, me.icn3d.intersectHash2Atoms(me.icn3d.displayAtoms, me.icn3d.highlightAtoms), parseFloat(threshold) );

            me.clearSelection();

            var residues = {}, atomArray = [];

            for (var i in me.icn3d.highlightAtoms) {
                var residueid = me.icn3d.atoms[i].structure + '_' + me.icn3d.atoms[i].chain + '_' + me.icn3d.atoms[i].resi;
                residues[residueid] = 1;

                atomArray.push(i);
            }

            var commandname = 'hbonds_' + firstAtom.serial;
            var commanddesc = 'all atoms that are hydrogen-bonded with the selected atoms';
            me.addCustomSelection(Object.keys(residues), atomArray, commandname, commanddesc, select, true);

            var nameArray = [commandname];

            me.showCustomResidues(nameArray);

            me.icn3d.draw(options2);
        }
    },

    addLabel: function (text, x, y, z, size, color, background) { var me = this;
        var label = {}; // Each label contains 'position', 'text', 'color', 'background'

        var position = new THREE.Vector3();
        position.x = x;
        position.y = y;
        position.z = z;

        label.position = position;

        label.text = text;
        label.size = size;
        label.color = color;
        label.background = background;

        me.icn3d.labels.push(label);

        me.icn3d.removeHighlightObjects();

        //me.icn3d.draw();
    },

    addLine: function (x1, y1, z1, x2, y2, z2, color, dashed) { var me = this;
        var line = {}; // Each line contains 'position1', 'position2', 'color', and a boolean of 'dashed'
        line.position1 = new THREE.Vector3(x1, y1, z1);
        line.position2 = new THREE.Vector3(x2, y2, z2);
        line.color = color;
        line.dashed = dashed;

        me.icn3d.lines.push(line);

        me.icn3d.removeHighlightObjects();

        //me.icn3d.draw();
    },

    selectAChain: function (chainid, commanddesc) { var me = this;
        var commandname = commanddesc.replace(/\s/g, '');
        var select = "Selection from chain annotation in 'Select Residue' dialog";

        var residueArray = [], atomArray = [];

        me.icn3d.removeHighlightObjects();

        //if(Object.keys(me.icn3d.highlightAtoms).length === Object.keys(me.icn3d.displayAtoms).length) me.icn3d.highlightAtoms = {};
        me.icn3d.highlightAtoms = {};
        for(var i in me.icn3d.chainsSeq[chainid]) { // get residue number
          var resObj = me.icn3d.chainsSeq[chainid][i];
          var residueid = chainid + "_" + resObj.resi;

            var value = resObj.name;

            if(value !== '' && value !== '-') {
              residueArray.push(residueid);
              for(var j in me.icn3d.residues[residueid]) {
                atomArray.push(j);
                me.icn3d.highlightAtoms[j] = 1;
              }
            }
        }

        me.addCustomSelection(residueArray, atomArray, commandname, commanddesc, select, true);

        me.icn3d.addHighlightObjects();
    },

    selectAAlignChain: function (chainid, commanddesc) { var me = this;
        var commandname = commanddesc.replace(/\s/g, '');
        var select = "Selection from chain annotation in 'Select Residue' dialog";

        var residueArray = [], atomArray = [];

        me.icn3d.removeHighlightObjects();

        //if(Object.keys(me.icn3d.highlightAtoms).length === Object.keys(me.icn3d.displayAtoms).length) me.icn3d.highlightAtoms = {};
        me.icn3d.highlightAtoms = {};
        for(var i in me.icn3d.alignChainsSeq[chainid]) { // get residue number
          var resObj = me.icn3d.alignChainsSeq[chainid][i];
          var residueid = chainid + "_" + resObj.resi;

            var value = resObj.name;

            if(value !== '' && value !== '-') {
              residueArray.push(residueid);
              for(var j in me.icn3d.residues[residueid]) {
                atomArray.push(j);
                me.icn3d.highlightAtoms[j] = 1;
              }
            }
        }

        me.addCustomSelection(residueArray, atomArray, commandname, commanddesc, select, true);

        me.icn3d.addHighlightObjects();
    },

    selectAResidue: function (residueid, commanddesc) { var me = this;
        var commandname = commanddesc.replace(/\s/g, '');
        var select = "Selection of a residue in 'Select Residue' dialog";

        var residueArray = [], atomArray = [];

        residueArray.push(residueid);
        for(var j in me.icn3d.residues[residueid]) {
          atomArray.push(j);
          me.icn3d.highlightAtoms[j] = 1;
        }

        me.addCustomSelection(residueArray, atomArray, commandname, commanddesc, select, true);
    },

    back: function () { var me = this;
      me.STATENUMBER--;

      if(me.STATENUMBER < 1) {
        me.STATENUMBER = 1;
      }
      else {
        me.execCommands(me.STATENUMBER);
      }

      me.adjustIcon();
    },

    forward: function () { var me = this;
      me.STATENUMBER++;

      if(me.STATENUMBER > me.icn3d.commands.length) {
        me.STATENUMBER = me.icn3d.commands.length;
      }
      else {
        me.execCommands(me.STATENUMBER);
      }

      me.adjustIcon();
    },

    toggleSelection: function () { var me = this;
        if(me.HIDE_SELECTION) {
            for(var i in me.icn3d.displayAtoms) {
                if(me.icn3d.highlightAtoms.hasOwnProperty(i)) delete me.icn3d.displayAtoms[i];
            }

              me.HIDE_SELECTION = false;
        }
        else {
            me.icn3d.displayAtoms = me.icn3d.unionHash(me.icn3d.displayAtoms, me.icn3d.highlightAtoms);

              me.HIDE_SELECTION = true;
        }

        me.icn3d.draw();
    },

    alternateStructures: function () { var me = this;
        me.icn3d.displayAtoms = {};

        var moleculeArray = Object.keys(me.icn3d.structures);
        for(var i = 0, il = moleculeArray.length; i < il; ++i) {
            var structure = moleculeArray[i];
            if(i > me.ALTERNATE_STRUCTURE || (me.ALTERNATE_STRUCTURE === il - 1 && i === 0) ) {
                for(var k in me.icn3d.structures[structure]) {
                    var chain = me.icn3d.structures[structure][k];
                    me.icn3d.displayAtoms = me.icn3d.unionHash(me.icn3d.displayAtoms, me.icn3d.chains[chain]);
                }

                var moleculeArray = [];
                moleculeArray.push(structure);

                me.changeStructureid(moleculeArray);
                var structuresHtml = me.getStructureSelections(false, moleculeArray);
                $("#" + me.pre + "structureid").html(structuresHtml);
                $("#" + me.pre + "structureid2").html(structuresHtml);

                //me.ALTERNATE_STRUCTURE = structure;
                me.ALTERNATE_STRUCTURE = i;
                break;
            }
        }

        me.icn3d.draw();
    },

    adjustIcon: function () { var me = this;
      if(me.STATENUMBER === 1) {
        if($("#" + me.pre + "back").hasClass('middleIcon')) {
          $("#" + me.pre + "back").toggleClass('middleIcon');
          $("#" + me.pre + "back").toggleClass('endIcon');
        }
      }
      else {
        if($("#" + me.pre + "back").hasClass('endIcon')) {
          $("#" + me.pre + "back").toggleClass('middleIcon');
          $("#" + me.pre + "back").toggleClass('endIcon');
        }
      }

      if(me.STATENUMBER === me.icn3d.commands.length) {
        if($("#" + me.pre + "forward").hasClass('middleIcon')) {
          $("#" + me.pre + "forward").toggleClass('middleIcon');
          $("#" + me.pre + "forward").toggleClass('endIcon');
        }
      }
      else {
        if($("#" + me.pre + "forward").hasClass('endIcon')) {
          $("#" + me.pre + "forward").toggleClass('middleIcon');
          $("#" + me.pre + "forward").toggleClass('endIcon');
        }
      }
    },

    toggle: function (id1, id2, id3, id4) { var me = this;
      $("#" + id1).toggleClass('ui-icon-plus');
      $("#" + id1).toggleClass('ui-icon-minus');

      $("#" + id2).toggleClass('ui-icon-plus');
      $("#" + id2).toggleClass('ui-icon-minus');

      $("#" + id1).toggleClass('shown');
      $("#" + id1).toggleClass('hidden');

      $("#" + id2).toggleClass('shown');
      $("#" + id2).toggleClass('hidden');

      $("#" + id3).toggleClass('shown');
      $("#" + id3).toggleClass('hidden');

      $("#" + id4).toggleClass('shown');
      $("#" + id4).toggleClass('hidden');
    },

//    exportState: function() { var me = this;
//        //http://stackoverflow.com/questions/22055598/writing-a-json-object-to-a-text-file-in-javascript
//        var url = 'data:text;charset=utf-8,' + encodeURIComponent(me.icn3d.commands.join('\n'));
//        window.open(url, '_blank');
//    },

    isIE: function() { var me = this;
        //http://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf("MSIE ");

        if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer
            return true;
        else                 // If another browser, return 0
            return false;
    },

    saveFile: function(filename, type) { var me = this;
        //Save file
        if(me.isIE()) { // IE
            if(window.navigator.msSaveBlob){
                if(type === 'text') {
                    var dataStr = me.icn3d.commands.join('\n');
                    var data = decodeURIComponent(dataStr);

                    var blob = new Blob([data],{ type: "text/html;charset=utf-8;"});
                    navigator.msSaveBlob(blob, filename);
                }
                else if(type === 'png') {
                   me.icn3d.render();
                   var blob = me.icn3d.renderer.domElement.msToBlob();

                    navigator.msSaveBlob(blob, filename);
                }
            }
        }
        else {
            var data;

            if(type === 'text') {
                var dataStr = me.icn3d.commands.join('\n');
                data = "data:text;charset=utf-8," + encodeURIComponent(dataStr);
            }
            else if(type === 'png') {
               me.icn3d.render();
               var dataStr = me.icn3d.renderer.domElement.toDataURL('image/png');

                data = dataStr;
            }

            window.open(data, '_blank');
        }
    },

    loadStateFile: function (dataStr) { var me = this;
      me.icn3d.bRender = false;

      dataStr = dataStr.replace(/;/g, '\n')

      me.icn3d.commands = dataStr.split('\n');

      me.STATENUMBER = me.icn3d.commands.length;

      me.execCommands(me.STATENUMBER);
    },

    execCommandsBase: function (start, end) { var me = this;
      for(var i=start; i <= end; ++i) {
          if(me.icn3d.commands[i].indexOf('load') !== -1) {
              $.when(me.applyCommandLoad(me.icn3d.commands[i])).then(function() {
                  me.execCommandsBase(i + 1, end);
              });
              return;
          }
          else {
              me.applyCommand(me.icn3d.commands[i]);
          }
      }
    },

    execCommands: function (steps) { var me = this;
        me.icn3d.bRender = false;
        me.execCommandsBase(0, steps-1);

        me.icn3d.bRender = true;

        var commandTransformation = me.icn3d.commands[steps-1].split('|||');

        if(commandTransformation.length == 2) {
            var transformation = JSON.parse(commandTransformation[1]);

            me.icn3d._zoomFactor = transformation.factor;

            me.icn3d.mouseChange.x = transformation.mouseChange.x;
            me.icn3d.mouseChange.y = transformation.mouseChange.y;

            me.icn3d.quaternion._x = transformation.quaternion._x;
            me.icn3d.quaternion._y = transformation.quaternion._y;
            me.icn3d.quaternion._z = transformation.quaternion._z;
            me.icn3d.quaternion._w = transformation.quaternion._w;
        }

        //me.renderStructure();
        me.icn3d.draw();
    },

/*
    execCommands: function (steps) { var me = this;
      me.icn3d.bRender = false;
      $.when(me.applyCommand0(me.icn3d.commands[0])).then(function() {
        me.execCommandsGT0(steps);

        me.icn3d.bRender = true;

        var commandTransformation = me.icn3d.commands[steps-1].split('|||');

        if(commandTransformation.length == 2) {
            var transformation = JSON.parse(commandTransformation[1]);

            me.icn3d._zoomFactor = transformation.factor;

            me.icn3d.mouseChange.x = transformation.mouseChange.x;
            me.icn3d.mouseChange.y = transformation.mouseChange.y;

            me.icn3d.quaternion._x = transformation.quaternion._x;
            me.icn3d.quaternion._y = transformation.quaternion._y;
            me.icn3d.quaternion._z = transformation.quaternion._z;
            me.icn3d.quaternion._w = transformation.quaternion._w;
        }

        //me.renderStructure();
        me.icn3d.draw();
      });
    },

    execCommandsGT0: function (steps) { var me = this;
      for(var i=1; i < steps; ++i) {
        me.applyCommand(me.icn3d.commands[i]);
      }
    },
*/

    applyCommandLoad: function (commandStr) { var me = this;
      me.setLogCommand(commandStr, true);
console.log("commandStr: " + commandStr);

      // chain functions together
      me.deferred2 = $.Deferred(function() {
      var commandTransformation = commandStr.split('|||');

      var commandOri = commandTransformation[0].replace(/\s\s/g, ' ').trim();
      var command = commandOri.toLowerCase();

      if(command.indexOf('load') !== -1) { // 'load pdb [pdbid]'
        // load pdb, mmcif, mmdb, cid
        var id = command.substr(command.lastIndexOf(' ') + 1);
        if(command.indexOf('pdb') !== -1) {
          me.downloadPdb(id);
        }
        else if(command.indexOf('mmcif') !== -1) {
          me.downloadMmcif(id);
        }
        else if(command.indexOf('mmdb') !== -1) {
          me.downloadMmdb(id);
        }
        else if(command.indexOf('term') !== -1) {
          me.downloadTerm(id);
        }
        else if(command.indexOf('gi') !== -1) {
          me.downloadGi(id);
        }
        else if(command.indexOf('cid') !== -1) {
          me.downloadCid(id);
        }
        else if(command.indexOf('align') !== -1) {
          me.downloadAlignment(id);
        }
      }
      }); // end of me.deferred = $.Deferred(function() {

      return me.deferred2;
    },

    applyCommand: function (commandStr) { var me = this;
      me.setLogCommand(commandStr, true);

      var commandTransformation = commandStr.split('|||');

      var commandOri = commandTransformation[0].replace(/\s\s/g, ' ').trim();
      var command = commandOri.toLowerCase();

      if(command.indexOf('export state file') !== -1) { // last step to update transformation
        // the last transformation will be applied
      }
      else if(commandOri.indexOf('select molecule') !== -1) {
        var idArray = commandOri.substr(commandOri.lastIndexOf(' ') + 1).split(',');
        if(idArray !== null) me.changeStructureid(idArray);
      }
      else if(commandOri.indexOf('select chain') !== -1) {
        var idArray = commandOri.substr(commandOri.lastIndexOf(' ') + 1).split(',');
        if(idArray !== null) me.changeChainid(idArray);
      }
      else if(commandOri.indexOf('select alignChain') !== -1) {
        var idArray = commandOri.substr(commandOri.lastIndexOf(' ') + 1).split(',');
        if(idArray !== null) me.changeAlignChainid(idArray);
      }
      else if(commandOri.indexOf('select residue') !== -1) {
        var idArray = commandOri.substr(commandOri.lastIndexOf(' ') + 1).split(',');
        if(idArray !== null) me.changeResidueid(idArray);
      }
      else if(commandOri.indexOf('select customresidues') !== -1) {
        var idArray = commandOri.substr(commandOri.lastIndexOf(' ') + 1).split(',');
        if(idArray !== null) me.showCustomResidues(idArray);
      }
      else if(commandOri.indexOf('select customatoms') !== -1) {
        var idArray = commandOri.substr(commandOri.lastIndexOf(' ') + 1).split(',');
        if(idArray !== null) me.showCustomAtoms(idArray);
      }
      else if(command.indexOf('show selected customResidues') !== -1) {
        me.showSelected(me.pre + 'customResidues');
      }
      else if(command.indexOf('show selected customAtoms') !== -1) {
        me.showSelected(me.pre + 'customAtoms');
      }
      else if(command.indexOf('select') !== -1 && command.indexOf('name') !== -1 && command.indexOf('description') !== -1) {
        var paraArray = commandOri.split(' | '); // atom names might be case-sensitive

        var select = paraArray[0].substr(paraArray[0].lastIndexOf(' ') + 1);
        var commandname = paraArray[1].substr(paraArray[1].lastIndexOf(' ') + 1);
        var commanddesc = paraArray[2].substr(paraArray[2].lastIndexOf(' ') + 1);

        me.selectResiduesAtoms(select, commandname, commanddesc);
      }
      else if(command.indexOf('picking yes') !== -1) {
        me.icn3d.picking = 1;
        me.icn3d.options['picking'] = 'atom';
      }
      else if(command.indexOf('picking no') !== -1) {
        me.icn3d.picking = 0;
        me.icn3d.options['picking'] = 'no';
        me.icn3d.draw(undefined, undefined);
        me.icn3d.removeHighlightObjects();
      }
      else if(command.indexOf('picking residue') !== -1) {
        me.icn3d.picking = 2;
        me.icn3d.options['picking'] = 'residue';
      }
      else if(command.indexOf('pickatom') !== -1) {
        var atomid = parseInt(command.substr(command.lastIndexOf(' ') + 1));

        me.icn3d.pickedatom = me.icn3d.atoms[atomid];

        // highlight the sequence background
        var pickedResidue = me.icn3d.pickedatom.structure + '_' + me.icn3d.pickedatom.chain + '_' + me.icn3d.pickedatom.resi;
        if($("#" + me.pre + pickedResidue).length !== 0) {
          $("#" + me.pre + pickedResidue).toggleClass('highlightSeq');
        }
      }
      else if(command.indexOf('select aroundsphere') !== -1) {
        var paraArray = command.split(' | ');
        var radius = paraArray[1].substr(paraArray[1].lastIndexOf(' ') + 1);
        var select = 'select aroundsphere | radius ' + radius;

        me.pickCustomSphere(select, radius);
      }
      else if(command.indexOf('style') !== -1) {
        var secondPart = command.substr(command.indexOf(' ') + 1);

        var selectionType = secondPart.substr(0, secondPart.indexOf(' '));
        var style = secondPart.substr(secondPart.indexOf(' ') + 1);

        me.setStyle(selectionType, style);
      }
      else if(command.indexOf('color') !== -1) {
        var color = command.substr(command.indexOf(' ') + 1);
        var options2 = {};
        options2['color'] = color;

        me.icn3d.setColorByOptions(options2, me.icn3d.highlightAtoms);
      }
      else if(command.indexOf('showsurface') !== -1
          || command.substr(0, 7) === 'surface'
          || command.substr(0, 7) === 'opacity'
          || command.substr(0, 9) === 'wireframe'

          || command.substr(0, 6) === 'camera'
          || command.substr(0, 10) === 'background'
          || command.substr(0, 4) === 'axis'
          ) {
        var value = command.substr(command.indexOf(' ') + 1);

        me.options['showsurface'] = value;
      }
      else if(command.indexOf('reset') !== -1) {
        //me.resetOrientation();

        me.show3DStructure();
      }
      else if(command.indexOf('toggle highlight') !== -1) {
        if(me.icn3d.prevHighlightObjects.length > 0) { // remove
            me.icn3d.removeHighlightObjects();
        }
        else { // add
            me.icn3d.addHighlightObjects();
        }
      }
      else if(command.indexOf('assembly yes') !== -1) {
        me.icn3d.bAssembly = true;
      }
      else if(command.indexOf('assembly no') !== -1) {
        me.icn3d.bAssembly = false;
      }
      else if(command.indexOf('add label') !== -1) {
        var paraArray = command.split(' | ');
        var text = paraArray[0].substr(paraArray[0].lastIndexOf(' ') + 1);

        me.addLabel(text, size, color, background);
        me.icn3d.draw();
      }
      else if(command.indexOf('add line') !== -1) {
        var paraArray = command.split(' | ');
        var p1Array = paraArray[1].split(' ');
        var p2Array = paraArray[2].split(' ');
        var color = paraArray[3].substr(paraArray[3].lastIndexOf(' ') + 1);
        var dashed = paraArray[4].substr(paraArray[4].lastIndexOf(' ') + 1) === 'true' ? true : false;

        me.addLine(p1Array[0], p1Array[1], p1Array[2], p2Array[0], p2Array[1], p2Array[2], color, dashed);
      }
      else if(command.indexOf('zoomin selected') !== -1) {
        me.icn3d.zoominSelection();
      }
      else if(command.indexOf('rotate left') !== -1) {
         me.icn3d.bStopRotate = false;
         me.ROTATION_DIRECTION = 'left';

         me.rotateStructure('left');
      }
      else if(command.indexOf('rotate right') !== -1) {
         me.icn3d.bStopRotate = false;
         me.ROTATION_DIRECTION = 'right';

         me.rotateStructure('right');
      }
      else if(command.indexOf('rotate up') !== -1) {
         me.icn3d.bStopRotate = false;
         me.ROTATION_DIRECTION = 'up';

         me.rotateStructure('up');
      }
      else if(command.indexOf('rotate down') !== -1) {
         me.icn3d.bStopRotate = false;
         me.ROTATION_DIRECTION = 'down';

         me.rotateStructure('down');
      }
      else if(command.indexOf('show hbonds |') !== -1) {
        var paraArray = command.split(' | ');
        var threshold = paraArray[1].substr(paraArray[1].lastIndexOf(' ') + 1);

        var select = 'show hbonds | threshold ' + threshold;

        me.showHbonds(select, threshold);
      }
      else if(command.indexOf('show hbonds no') !== -1) {
        me.options["hbonds"] = "no";
        me.icn3d.draw(me.options);
        }
      else if(command.indexOf('show distance no') !== -1) {
        me.options["lines"] = "no";
        me.icn3d.draw(me.options);
        }
      else if(command.indexOf('show labels no') !== -1) {
        me.options["labels"] = "no";
        me.icn3d.draw(me.options);
        }
      else if(command.indexOf('back') !== -1) {
         me.back();
      }
      else if(command.indexOf('forward') !== -1) {
         me.forward();
      }
      else if(command.indexOf('toggle selected atoms') !== -1) {
         me.toggleSelection();
      }

      else if(command.indexOf('select all') !== -1) {
         me.selectAll();
      }
      else if(command.indexOf('select complement') !== -1) {
         me.selectComplement();
      }
      else if(command.indexOf('set highlight color') !== -1) {
           var color = command.substr(20);
           if(color === 'yellow') {
               me.icn3d.highlightColor = new THREE.Color(0xFFFF00);
               me.icn3d.matShader = me.icn3d.setOutlineColor('yellow');
           }
           else if(color === 'green') {
               me.icn3d.highlightColor = new THREE.Color(0x00FF00);
               me.icn3d.matShader = me.icn3d.setOutlineColor('green');
           }
           else if(color === 'red') {
               me.icn3d.highlightColor = new THREE.Color(0xFF0000);
               me.icn3d.matShader = me.icn3d.setOutlineColor('red');
           }
           me.icn3d.draw(); // required to make it work properly
      }
      else if(command.indexOf('set highlight style') !== -1) {
           var style = command.substr(20);
           if(style === 'outline') {
               me.icn3d.bHighlight = 1;
           }
           else if(style === 'object') {
               me.icn3d.bHighlight = 2;
           }

           me.icn3d.draw();
      }
    },

    setMenu: function (id) { var me = this;
        var html = "";

        html += "<div style='position:relative;'>";
        html += "  <!--https://forum.jquery.com/topic/looking-for-a-jquery-horizontal-menu-bar-->";
        html += "  <div id='" + me.pre + "menulist' style='position:absolute; z-index:999; float:left; display:table-row; margin: 3px 0px 0px 3px;'>";
        html += "    <table border='0' cellpadding='0' cellspacing='0' width='100'><tr>";

        html += "    <td valign='top'>";
        html += "    <div style='float:left; margin:10px 5px 0px 5px;'>";
        html += "          <span id='" + me.pre + "back' class='ui-icon ui-icon-arrowthick-1-w middleIcon link' title='Step backward'></span>";
        html += "    </div>";
        html += "    </td>";

        html += "    <td valign='top'>";
        html += "    <div style='float:left; margin:10px 5px 0px 5px;'>";
        html += "          <span id='" + me.pre + "forward' class='ui-icon ui-icon-arrowthick-1-e middleIcon link' title='Step forward'></span>";
        html += "    </div>";
        html += "    </td>";

        html += "    <td valign='top'>";
        html += "    <div style='float:left;'>";
        html += "          <accordion id='" + me.pre + "accordion1'>";
        html += "              <h3>File</h3>";
        html += "              <div>";
        html += "              <ul class='menu'>";
        html += "                <li>Retrieve by ID";
        html += "                  <ul>";
        html += "                    <li><span id='" + me.pre + "menu1_pdbid' class='link'>PDB ID</span></li>";
        html += "                    <li><span id='" + me.pre + "menu1_mmcifid' class='link'>mmCIF ID</span></li>";
        html += "                    <li><span id='" + me.pre + "menu1_mmdbid' class='link'>MMDB ID</span></li>";
        //html += "                    <li><span id='" + me.pre + "menu1_term' class='link'>Search MMDB term</span></li>";
        html += "                    <li><span id='" + me.pre + "menu1_gi' class='link'>gi</span></li>";
        html += "                    <li><span id='" + me.pre + "menu1_cid' class='link'>PubChem CID</span></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li><span id='" + me.pre + "menu1_pdbfile' class='link'>Open PDB File</span></li>";
        html += "                <li><span id='" + me.pre + "menu1_state' class='link'>Open State/Script</span></li>";
        html += "                <li><span id='" + me.pre + "menu1_exportState' class='link'>Export State<br/></span></li>";
        html += "                <li><span id='" + me.pre + "menu1_exportCanvas' class='link'>Export Image</span></li>";
        html += "                <li>Links";
        html += "                  <ul>";
        html += "                    <li><span id='" + me.pre + "menu1_link_structure' class='link'>Search Structure</span></li>";
        html += "                    <li><span id='" + me.pre + "menu1_link_vast' class='link'>Find Similar Structures</span></li>";
        html += "                    <li><span id='" + me.pre + "menu1_link_pubmed' class='link'>Literature</span></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "              </ul>";
        html += "              </div>";
        html += "          </accordion>";
        html += "    </div>";
        html += "    </td>";

        html += "    <td valign='top'>";
        html += "    <div style='float:left;'>";
        html += "          <accordion id='" + me.pre + "accordion2'>";
        html += "              <h3>Select</h3>";
        html += "              <div>";
        html += "              <ul class='menu'>";

        html += "                <li>Select";
        html += "                  <ul>";
        if(me.cfg.cid === undefined) {
            html += "                      <li><input type='radio' name='" + me.pre + "menu2_select' id='" + me.pre + "menu2_select_chain'><label for='" + me.pre + "menu2_select_chain'>Structure/Chain</label></li>";
        }
        html += "                      <li><input type='radio' name='" + me.pre + "menu2_select' id='" + me.pre + "menu2_selectall'><label for='" + me.pre + "menu2_selectall'>All</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu2_select' id='" + me.pre + "menu2_selectcomplement'><label for='" + me.pre + "menu2_selectcomplement'>Complement</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu2_select' id='" + me.pre + "menu2_aroundsphere'><label for='" + me.pre + "menu2_aroundsphere'>Custom Sphere</label></li>";
        if(me.cfg.cid === undefined) {
            html += "                      <li><input type='radio' name='" + me.pre + "menu2_select' id='" + me.pre + "menu2_selectresidues'><label for='" + me.pre + "menu2_selectresidues'>Sequences</label></li>";
        }
        if(me.cfg.align !== undefined) {
            html += "                      <li><input type='radio' name='" + me.pre + "menu2_select' id='" + me.pre + "menu2_alignment'><label for='" + me.pre + "menu2_alignment'>Aligned Seq.</label></li>";
        }
        html += "                      <li><input type='radio' name='" + me.pre + "menu2_select' id='" + me.pre + "menu2_command'><label for='" + me.pre + "menu2_command'>by Command</label></li>";
        html += "                  </ul>";
        html += "                </li>";

        html += "                <li>Picking";
        html += "                  <ul>";
        if(me.cfg.cid === undefined) {
            html += "                      <li><input type='radio' name='" + me.pre + "menu2_picking' id='" + me.pre + "menu2_pickingResidue' checked><label for='" + me.pre + "menu2_pickingResidue'>Residue</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu2_picking' id='" + me.pre + "menu2_pickingYes'><label for='" + me.pre + "menu2_pickingYes'>Atom</label></li>";
        }
        else {
            html += "                      <li><input type='radio' name='" + me.pre + "menu2_picking' id='" + me.pre + "menu2_pickingResidue'><label for='" + me.pre + "menu2_pickingResidue'>Residue</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu2_picking' id='" + me.pre + "menu2_pickingYes' checked><label for='" + me.pre + "menu2_pickingYes'>Atom</label></li>";
        }

        html += "                      <li><input type='radio' name='" + me.pre + "menu2_picking' id='" + me.pre + "menu2_pickingNo'><label for='" + me.pre + "menu2_pickingNo'>Off</label></li>";
        html += "                  </ul>";
        html += "                </li>";

        html += "                <li>Display";
        html += "                  <ul>";
        if(me.cfg.align !== undefined) {
            html += "                      <li><input type='radio' name='" + me.pre + "menu2_display' id='" + me.pre + "menu2_alternate'><label for='" + me.pre + "menu2_alternate'>Alternate Structures</label></li>";
        }
        html += "                      <li><input type='radio' name='" + me.pre + "menu2_display' id='" + me.pre + "menu2_toggle'><label for='" + me.pre + "menu2_toggle'>Toggle Selection</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu2_display' id='" + me.pre + "menu2_show_selected'><label for='" + me.pre + "menu2_show_selected'>Display Selection</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu2_display' id='" + me.pre + "toggleHighlight2'><label for='" + me.pre + "toggleHighlight2'>Toggle Highlight</label></li>";
        html += "                  </ul>";
        html += "                </li>";

        html += "                    <li>Highlight Color";
        html += "                      <ul>";
        html += "                        <li><input type='radio' name='" + me.pre + "menu2_hl_color' id='" + me.pre + "menu2_hl_colorYellow' checked><label for='" + me.pre + "menu2_hl_colorYellow'>Yellow</label></li>";
        html += "                        <li><input type='radio' name='" + me.pre + "menu2_hl_color' id='" + me.pre + "menu2_hl_colorGreen'><label for='" + me.pre + "menu2_hl_colorGreen'>Green</label></li>";
        html += "                        <li><input type='radio' name='" + me.pre + "menu2_hl_color' id='" + me.pre + "menu2_hl_colorRed'><label for='" + me.pre + "menu2_hl_colorRed'>Red</label></li>";
        html += "                      </ul>";
        html += "                    </li>";
        html += "                    <li>Highlight Style";
        html += "                      <ul>";

        if(Detector.webgl) {
            html += "                        <li><input type='radio' name='" + me.pre + "menu2_hl_style' id='" + me.pre + "menu2_hl_styleOutline' checked><label for='" + me.pre + "menu2_hl_styleOutline'>Outline</label></li>";
            html += "                        <li><input type='radio' name='" + me.pre + "menu2_hl_style' id='" + me.pre + "menu2_hl_styleObject'><label for='" + me.pre + "menu2_hl_styleObject'>3D Objects</label></li>";
        }
        else {
            html += "                        <li><input type='radio' name='" + me.pre + "menu2_hl_style' id='" + me.pre + "menu2_hl_styleOutline'><label for='" + me.pre + "menu2_hl_styleOutline'>Outline</label></li>";
            html += "                        <li><input type='radio' name='" + me.pre + "menu2_hl_style' id='" + me.pre + "menu2_hl_styleObject' checked><label for='" + me.pre + "menu2_hl_styleObject'>3D Objects</label></li>";
        }
        html += "                      </ul>";
        html += "                    </li>";

        html += "              </ul>";
        html += "              </div>";
        html += "          </accordion>";
        html += "    </div>";
        html += "    </td>";

        html += "    <td valign='top'>";
        html += "    <div style='float:left;'>";
        html += "          <accordion id='" + me.pre + "accordion3'>";
        html += "              <h3>Style</h3>";
        html += "              <div>";
        html += "              <ul class='menu'>";

        if(me.cfg.cid === undefined) {
            html += "                <li>Protein";
            html += "                  <ul>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_protein' id='" + me.pre + "menu3_proteinRibbon' checked><label for='" + me.pre + "menu3_proteinRibbon'>Ribbon</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_protein' id='" + me.pre + "menu3_proteinStrand'><label for='" + me.pre + "menu3_proteinStrand'>Strand</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_protein' id='" + me.pre + "menu3_proteinCylinder'><label for='" + me.pre + "menu3_proteinCylinder'>Cylinder and Plate</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_protein' id='" + me.pre + "menu3_proteinCalpha'><label for='" + me.pre + "menu3_proteinCalpha'>C alpha Trace</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_protein' id='" + me.pre + "menu3_proteinBfactor'><label for='" + me.pre + "menu3_proteinBfactor'>B Factor Tube</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_protein' id='" + me.pre + "menu3_proteinLines'><label for='" + me.pre + "menu3_proteinLines'>Lines</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_protein' id='" + me.pre + "menu3_proteinStick'><label for='" + me.pre + "menu3_proteinStick'>Stick</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_protein' id='" + me.pre + "menu3_proteinBallstick'><label for='" + me.pre + "menu3_proteinBallstick'>Ball and Stick</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_protein' id='" + me.pre + "menu3_proteinSphere'><label for='" + me.pre + "menu3_proteinSphere'>Sphere</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_protein' id='" + me.pre + "menu3_proteinNothing'><label for='" + me.pre + "menu3_proteinNothing'>Hide</label></li>";
            html += "                  </ul>";
            html += "                </li>";

            html += "                <li>Nucleotides";
            html += "                  <ul>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_nucl' id='" + me.pre + "menu3_nuclCartoon'><label for='" + me.pre + "menu3_nuclCartoon'>Cartoon</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_nucl' id='" + me.pre + "menu3_nuclPhos' checked><label for='" + me.pre + "menu3_nuclPhos'>Phosphorus Trace</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_nucl' id='" + me.pre + "menu3_nuclLines'><label for='" + me.pre + "menu3_nuclLines'>Lines</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_nucl' id='" + me.pre + "menu3_nuclStick'><label for='" + me.pre + "menu3_nuclStick'>Stick</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_nucl' id='" + me.pre + "menu3_nuclBallstick'><label for='" + me.pre + "menu3_nuclBallstick'>Ball and Stick</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_nucl' id='" + me.pre + "menu3_nuclSphere'><label for='" + me.pre + "menu3_nuclSphere'>Sphere</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu3_nucl' id='" + me.pre + "menu3_nuclNothing'><label for='" + me.pre + "menu3_nuclNothing'>Hide</label></li>";
            html += "                  </ul>";
            html += "                </li>";
        }

        html += "                <li>Ligands";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu3_ligands' id='" + me.pre + "menu3_ligandsLines'><label for='" + me.pre + "menu3_ligandsLines'>Lines</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu3_ligands' id='" + me.pre + "menu3_ligandsStick' checked><label for='" + me.pre + "menu3_ligandsStick'>Stick</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu3_ligands' id='" + me.pre + "menu3_ligandsBallstick'><label for='" + me.pre + "menu3_ligandsBallstick'>Ball and Stick</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu3_ligands' id='" + me.pre + "menu3_ligandsSphere'><label for='" + me.pre + "menu3_ligandsSphere'>Sphere</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu3_ligands' id='" + me.pre + "menu3_ligandsNothing'><label for='" + me.pre + "menu3_ligandsNothing'>Hide</label></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li>Ions";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu3_ions' id='" + me.pre + "menu3_ionsSphere' checked><label for='" + me.pre + "menu3_ionsSphere'>Sphere</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu3_ions' id='" + me.pre + "menu3_ionsDot'><label for='" + me.pre + "menu3_ionsDot'>Dot</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu3_ions' id='" + me.pre + "menu3_ionsNothing'><label for='" + me.pre + "menu3_ionsNothing'>Hide</label></li>";
        html += "                  </ul>";
        html += "                </li>";

        html += "                <li>Water";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu3_water' id='" + me.pre + "menu3_waterSphere'><label for='" + me.pre + "menu3_waterSphere'>Sphere</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu3_water' id='" + me.pre + "menu3_waterDot'><label for='" + me.pre + "menu3_waterDot'>Dot</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu3_water' id='" + me.pre + "menu3_waterNothing' checked><label for='" + me.pre + "menu3_waterNothing'>Hide</label></li>";
        html += "                  </ul>";
        html += "                </li>";

        html += "              </ul>";
        html += "              </div>";
        html += "          </accordion>";
        html += "    </div>";
        html += "    </td>";

        html += "    <td valign='top'>";
        html += "    <div style='float:left;'>";
        html += "          <accordion id='" + me.pre + "accordion4'>";
        html += "              <h3>Color</h3>";
        html += "              <div>";
        html += "              <ul class='menu'>";

        if(me.cfg.cid === undefined) {
            if(me.cfg.mmdbid !== undefined) {
                html += "                <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorSpectrum'><label for='" + me.pre + "menu4_colorSpectrum'>Spectrum</label></li>";
            }
            else {
                html += "                <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorSpectrum' checked><label for='" + me.pre + "menu4_colorSpectrum'>Spectrum</label></li>";
            }
            html += "                <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorChain'><label for='" + me.pre + "menu4_colorChain'>Chain</label></li>";
            html += "                <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorSS'><label for='" + me.pre + "menu4_colorSS'>Secondary</label></li>";
            html += "                <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorBfactor'><label for='" + me.pre + "menu4_colorBfactor'>B Factor</label></li>";
            html += "                <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorResidue'><label for='" + me.pre + "menu4_colorResidue'>Residue</label></li>";
            html += "                <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorPolarity'><label for='" + me.pre + "menu4_colorPolarity'>Polarity</label></li>";
            html += "                <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorAtom'><label for='" + me.pre + "menu4_colorAtom'>Atom</label></li>";
        }
        else {
            html += "                <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorAtom' checked><label for='" + me.pre + "menu4_colorAtom'>Atom</label></li>";
        }

        html += "                <li>-</li>";
        html += "                <li>Unicolor";
        html += "                  <ul>";
        html += "                    <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorRed'><label for='" + me.pre + "menu4_colorRed'>Red</label></li>";
        html += "                    <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorGreen'><label for='" + me.pre + "menu4_colorGreen'>Green</label></li>";
        html += "                    <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorBlue'><label for='" + me.pre + "menu4_colorBlue'>Blue</label></li>";
        html += "                    <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorMagenta'><label for='" + me.pre + "menu4_colorMagenta'>Magenta</label></li>";
        html += "                    <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorYellow'><label for='" + me.pre + "menu4_colorYellow'>Yellow</label></li>";
        html += "                    <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorCyan'><label for='" + me.pre + "menu4_colorCyan'>Cyan</label></li>";
        html += "                    <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorWhite'><label for='" + me.pre + "menu4_colorWhite'>White</label></li>";
        html += "                    <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorGrey'><label for='" + me.pre + "menu4_colorGrey'>Grey</label></li>";
        html += "                  </ul>";
        html += "                <li>-</li>";
        html += "                <li><input type='radio' name='" + me.pre + "menu4_color' id='" + me.pre + "menu4_colorCustom'><label for='" + me.pre + "menu4_colorCustom'>Custom</label></li>";
        html += "              </ul>";
        html += "              </div>";
        html += "          </accordion>";
        html += "    </div>";
        html += "    </td>";

        html += "    <td valign='top'>";
        html += "    <div style='float:left;'>";
        html += "          <accordion id='" + me.pre + "accordion5'>";
        html += "              <h3>Surface</h3>";
        html += "              <div>";
        html += "              <ul class='menu'>";
        html += "                <li>Show Surface";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_showsurface' id='" + me.pre + "menu5_showsurfaceYes'><label for='" + me.pre + "menu5_showsurfaceYes'>Yes</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_showsurface' id='" + me.pre + "menu5_showsurfaceNo' checked><label for='" + me.pre + "menu5_showsurfaceNo'>No</label></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li>Type";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_surface' id='" + me.pre + "menu5_surfaceVDW' checked><label for='" + me.pre + "menu5_surfaceVDW'>Van der Waals</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_surface' id='" + me.pre + "menu5_surfaceSES'><label for='" + me.pre + "menu5_surfaceSES'>Solvent Excluded</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_surface' id='" + me.pre + "menu5_surfaceSAS'><label for='" + me.pre + "menu5_surfaceSAS'>Solvent Accessible</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_surface' id='" + me.pre + "menu5_surfaceMolecular'><label for='" + me.pre + "menu5_surfaceMolecular'>Molecular Surface</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_surface' id='" + me.pre + "menu5_surfaceNothing'><label for='" + me.pre + "menu5_surfaceNothing'>Hide</label></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li>Opacity";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_opacity' id='" + me.pre + "menu5_opacity10'><label for='" + me.pre + "menu5_opacity10'>1.0</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_opacity' id='" + me.pre + "menu5_opacity09'><label for='" + me.pre + "menu5_opacity09'>0.9</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_opacity' id='" + me.pre + "menu5_opacity08' checked><label for='" + me.pre + "menu5_opacity08'>0.8</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_opacity' id='" + me.pre + "menu5_opacity07'><label for='" + me.pre + "menu5_opacity07'>0.7</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_opacity' id='" + me.pre + "menu5_opacity06'><label for='" + me.pre + "menu5_opacity06'>0.6</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_opacity' id='" + me.pre + "menu5_opacity05'><label for='" + me.pre + "menu5_opacity05'>0.5</label></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li>Wireframe";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_wireframe' id='" + me.pre + "menu5_wireframeYes'><label for='" + me.pre + "menu5_wireframeYes'>Yes</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu5_wireframe' id='" + me.pre + "menu5_wireframeNo' checked><label for='" + me.pre + "menu5_wireframeNo'>No</label></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "              </ul>";
        html += "              </div>";
        html += "          </accordion>";
        html += "    </div>";
        html += "    </td>";

        html += "    <td valign='top'>";
        html += "    <div style='float:left;'>";
        html += "          <accordion id='" + me.pre + "accordion6'>";
        html += "              <h3>Other</h3>";
        html += "              <div>";
        html += "              <ul class='menu'>";
        html += "                <li><span id='" + me.pre + "reset' class='link'>Reset</span></li>";
        //html += "                <li><span id='" + me.pre + "menu6_pickcenter' class='link'>Center on Picked Atom</span></li>";
        html += "                <li><span id='" + me.pre + "menu6_selectedcenter' class='link'>Zoom in Selection</span></li>";
        html += "                <li><span id='" + me.pre + "menu6_back' class='link'>Back</span></li>";
        html += "                <li><span id='" + me.pre + "menu6_forward' class='link'>Forward</span></li>";
        if(me.cfg.cid === undefined) {
            html += "                <li>Assembly";
            html += "                  <ul>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu6_assembly' id='" + me.pre + "menu6_assemblyYes'><label for='" + me.pre + "menu6_assemblyYes'>Yes</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu6_assembly' id='" + me.pre + "menu6_assemblyNo' checked><label for='" + me.pre + "menu6_assemblyNo'>No</label></li>";
            html += "                  </ul>";
            html += "                </li>";
            html += "                <li>H-bonds to selection";
            html += "                  <ul>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu6_hbonds' id='" + me.pre + "menu6_hbondsYes'><label for='" + me.pre + "menu6_hbondsYes'>Show</label></li>";
            html += "                      <li><input type='radio' name='" + me.pre + "menu6_hbonds' id='" + me.pre + "menu6_hbondsNo' checked><label for='" + me.pre + "menu6_hbondsNo'>Hide</label></li>";
            html += "                  </ul>";
            html += "                </li>";
        }
        html += "                <li>Custom Labels";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu6_addlabel' id='" + me.pre + "menu6_addlabelYes'><label for='" + me.pre + "menu6_addlabelYes'>Show</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu6_addlabel' id='" + me.pre + "menu6_addlabelNo' checked><label for='" + me.pre + "menu6_addlabelNo'>Hide</label></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li>Distance";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu6_distance' id='" + me.pre + "menu6_distanceYes'><label for='" + me.pre + "menu6_distanceYes'>Show</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu6_distance' id='" + me.pre + "menu6_distanceNo' checked><label for='" + me.pre + "menu6_distanceNo'>Hide</label></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li>Auto Rotation";
        html += "                  <ul>";
        html += "                      <li><span id='" + me.pre + "menu6_rotateleft' class='link'>Rotate Left</span></li>";
        html += "                      <li><span id='" + me.pre + "menu6_rotateright' class='link'>Rotate Right</span></li>";
        html += "                      <li><span id='" + me.pre + "menu6_rotateup' class='link'>Rotate Up</span></li>";
        html += "                      <li><span id='" + me.pre + "menu6_rotatedown' class='link'>Rotate Down</span></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li>Camera";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu6_camera' id='" + me.pre + "menu6_cameraPers' checked><label for='" + me.pre + "menu6_cameraPers'>Perspective</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu6_camera' id='" + me.pre + "menu6_cameraOrth'><label for='" + me.pre + "menu6_cameraOrth'>Orthographic</label></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li>Background";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu6_bkgd' id='" + me.pre + "menu6_bkgdBlack' checked><label for='" + me.pre + "menu6_bkgdBlack'>Black</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu6_bkgd' id='" + me.pre + "menu6_bkgdGrey'><label for='" + me.pre + "menu6_bkgdGrey'>Grey</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu6_bkgd' id='" + me.pre + "menu6_bkgdWhite'><label for='" + me.pre + "menu6_bkgdWhite'>White</label></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li>XYZ-axes";
        html += "                  <ul>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu6_showaxis' id='" + me.pre + "menu6_showaxisYes'><label for='" + me.pre + "menu6_showaxisYes'>Show</label></li>";
        html += "                      <li><input type='radio' name='" + me.pre + "menu6_showaxis' id='" + me.pre + "menu6_showaxisNo' checked><label for='" + me.pre + "menu6_showaxisNo'>Hide</label></li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li>Transform Hint";
        html += "                  <ul>";
        html += "                    <li>Rotate";
        html += "                        <ul>";
        html += "                            <li>Left Mouse</li>";
        html += "                            <li>Key L: Left</li>";
        html += "                            <li>Key J: Right</li>";
        html += "                            <li>Key I: Up</li>";
        html += "                            <li>Key M: Down</li>";
        html += "                        </ul>";
        html += "                    </li>";
        html += "                    <li>Zoom";
        html += "                        <ul>";
        html += "                            <li>Middle Mouse</li>";
        html += "                            <li>Left Mouse + Shift</li>";
        html += "                            <li>Key Z: Zoom in</li>";
        html += "                            <li>Key X: Zoom out</li>";
        html += "                        </ul>";
        html += "                    </li>";
        html += "                    <li>Translate";
        html += "                        <ul>";
        html += "                            <li>Right Mouse</li>";
        html += "                            <li>Left Mouse + Ctrl</li>";
        html += "                            <li>Arrow Left: Left</li>";
        html += "                            <li>Arrow Right: Right</li>";
        html += "                            <li>Arrow Up: Up</li>";
        html += "                            <li>Arrow Down: Down</li>";
        html += "                        </ul>";
        html += "                    </li>";
        html += "                  </ul>";
        html += "                </li>";
        html += "                <li><a href='//www.ncbi.nlm.nih.gov/Structure/icn3d/icn3d.html' target='_blank'>Help</a></li>";
        html += "              </ul>";
        html += "              </div>";
        html += "          </accordion>";
        html += "    </div>";
        html += "    </td>";

        html += "    <td valign='top'>";
        html += "    <div style='float:left; margin:10px 5px 0px 5px;'>";
        html += "    <a href='//www.ncbi.nlm.nih.gov/Structure/icn3d/icn3d.html' target='_blank'><span class='ui-icon ui-icon-help middleIcon link' title='click to see the help page'></span></a>";
        html += "    </div>";
        html += "    </td>";

        html += "  </tr>";
        html += "  </table>";
        html += "  </div>";

        // separate for the log box
        html += "  <div id='" + me.pre + "commandlog' style='position:absolute; z-index:555; float:left; display:table-row; margin: 3px 0px 0px " + me.MENU_WIDTH + "px;'>";

        html += "    <div style='float:left' class='commandTitle'>Script/Log (<a href='//www.ncbi.nlm.nih.gov/Structure/icn3d/icn3d.html#commands' target='_blank'><span title='click to see all commands'>Hint</span></a>)</div><br/>";
        html += "    <textarea id='" + me.pre + "logtext' rows='3' cols='40'></textarea>";
        html += "  </div>";

        // second row
        html += "  <div id='" + me.pre + "selection' style='position:absolute; z-index:555; float:left; display:table-row; margin: 32px 0px 0px 3px;'>";
        html += "    <table style='margin-top: 3px;'><tr valign='center'>";

        if(me.cfg.cid === undefined) {
            html += "        <td valign='top'><span class='commandTitle'>Structure:</span><br/>";
            html += "        <div style='margin-top:-3px;'><select id='" + me.pre + "structureid' multiple size='1' style='min-width:50px;'>";
            html += "        </select></div></td>";

            if(me.cfg.align !== undefined) {
                html += "        <td valign='top'><span class='commandTitle'>Aligned:</span><br/>";
                html += "        <div style='margin-top:-3px;'><select id='" + me.pre + "alignChainid' multiple size='1' style='min-width:50px;'>";
                html += "        </select></div></td>";
            }
            else {
                html += "        <td valign='top'><span class='commandTitle'>Chain:</span><br/>";
                html += "        <div style='margin-top:-3px;'><select id='" + me.pre + "chainid' multiple size='1' style='min-width:50px;'>";
                html += "        </select></div></td>";
            }
        }

        html += "        <td valign='top'><span class='commandTitle'>Custom:</span><br/>";
        html += "        <div style='margin-top:-3px;'><select id='" + me.pre + "customResidues' multiple size='1' style='min-width:50px;'>";
        html += "        </select></div></td>";

        var buttonStyle = me.isMobile() ? 'none' : 'button';

        html += "      <td valign='top'><div style='margin:3px 0px 0px 10px;'><button style='-webkit-appearance:" + buttonStyle + "; height:36px;' id='" + me.pre + "selectall'><span style='white-space:nowrap' class='commandTitle' title='Select all atoms'>Select<br/>All</span></button></div></td>";

        var seqName;
        if(me.cfg.align !== undefined) {
            //seqName = (me.isMobile()) ? 'Aligned<br/>Seq.' : 'Aligned<br/>Sequences';
            seqName = 'Aligned<br/>Seq.';
        }
        else {
            //seqName = (me.isMobile()) ? 'Seq.' : 'Sequences';
            seqName = 'Sequ-<br/>ence';
        }

        if(me.cfg.cid === undefined) {
            html += "      <td valign='top'><div style='margin:3px 0px 0px 10px;'><button style='-webkit-appearance:" + buttonStyle + "; height:36px;' id='" + me.pre + "show_sequences'><span style='white-space:nowrap' class='commandTitle' title='Show the sequences of the selected structure'>" + seqName + "</span></button></div></td>";

            //if(me.cfg.align !== undefined) {
            html += "      <td valign='top'><div id='" + me.pre + "alternateWrapper' style='margin:3px 0px 0px 10px;'><button style='-webkit-appearance:" + buttonStyle + "; height:36px;' id='" + me.pre + "alternate'><span style='white-space:nowrap' class='commandTitle' title='Alternate the structures'>Alternate<br/>Selection</span></button></div></td>";
            //}
        }

//        html += "      <td valign='top'><div style='margin:3px 0px 0px 10px;'><button id='" + me.pre + "toggle'><span style='white-space:nowrap' class='commandTitle' title='Toggle the selected atoms on and off'>Toggle<br/>Selection</span></button></div></td>";

        html += "      <td valign='top'><div style='margin:3px 0px 0px 10px;'><button style='-webkit-appearance:" + buttonStyle + "; height:36px;' id='" + me.pre + "show_selected'><span style='white-space:nowrap' class='commandTitle' title='Display the selected atoms ONLY'>Display<br/>Selection</span></button></div></td>";

        html += "      <td valign='top'><div style='margin:3px 0px 0px 10px;'><button style='-webkit-appearance:" + buttonStyle + "; height:36px;' id='" + me.pre + "zoomin_selection'><span style='white-space:nowrap' class='commandTitle' title='Center on the selected atoms and zoom in'>Zoom in<br/>Selection</span></button></div></td>";

        if(me.cfg.align === undefined) {
            html += "      <td valign='top'><div style='margin:3px 0px 0px 10px;'><button style='-webkit-appearance:" + buttonStyle + "; height:36px;' id='" + me.pre + "toggleHighlight'><span style='white-space:nowrap' class='commandTitle' title='Turn on and off the 3D highlight in the viewer'>Toggle<br/>Highlight</span></button></div></td>";
        }

        html += "    </tr></table>";
        html += "    </div>";

        html += "  <div id='" + me.pre + "viewer' style='width:100%; height:100%; background-color: #ddd;'>";
        html += "   <div id='" + me.pre + "menuLogSection'>";
        html += "    <div style='height: " + me.MENU_HEIGHT + "px;'></div>";
        html += "    <div style='height: " + me.MENU_HEIGHT + "px;'></div>";

        html += "   </div>";

        html += "    <div id='" + me.pre + "wait' style='width:100%; height: 100%; background-color: rgba(221,221,221, 0.8);'><div style='padding-top:25%; text-align: center; font-size: 2em; color: #777777;'>Loading the structure...</div></div>";
        html += "    <canvas id='" + me.pre + "canvas' style='width:100%; height: 100%; background-color: #000;'>Your browser does not support WebGL.</canvas>";

        html += "  </div>";

        html += "</div>";

        html += "<!-- dialog will not be part of the form -->";
        html += "<div id='" + me.pre + "allselections' class='hidden'>";

        // filter for large structure
        html += "<div id='" + me.pre + "dl_filter' style='overflow:auto; position:relative;'>";
        //html += "  <div>This large structure contains more than 50,000 atoms. Please select some structures/chains below to display.</div>";
        //html += "  <input style='position:absolute; top:8px; left:15px;' type='checkbox' id='" + me.pre + "filter_ckbx_all'/>";
        html += "  <div style='text-align:center; margin-bottom:10px;'><button id='" + me.pre + "filter'><span style='white-space:nowrap'><b>Show Structure</b></span></button>";
        html += "<button id='" + me.pre + "label_3d_diagram' style='margin-left:10px;'><span style='white-space:nowrap'><b>Show Labels</b></span></button></div>";
        html += "  <div id='" + me.pre + "dl_filter_table' class='box'>";
        html += "  </div>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_selectresidues'>";

        html += "  <div id='" + me.pre + "dl_sequence' class='dl_sequence'>";
        html += "  </div>";

        html += "</div>";

        if(me.cfg.align !== undefined) {
          html += "<div id='" + me.pre + "dl_alignment'>";
          html += "  <div id='" + me.pre + "dl_sequence2' class='dl_sequence'>";
          html += "  </div>";
          html += "</div>";
        }

        html += "<div id='" + me.pre + "dl_command'>";
        html += "  <table><tr><td valign='top'><table>";
        html += "<tr><td align='right'><b>Select (<a href='//www.ncbi.nlm.nih.gov/Structure/icn3d/icn3d.html#selectb' target='_blank'><span title='click to see how to select'>Hint</span></a>):</b></td><td><input type='text' id='" + me.pre + "command' placeholder='#[structures].[chains]:[residues]@[atoms]' size='30'></td></tr>";
        html += "<tr><td align='right'><b>Name:</b></td><td><input type='text' id='" + me.pre + "command_name' placeholder='my_selection' size='30'></td></tr>";
        html += "<tr><td align='right'><b>Description:</b></td><td><input type='text' id='" + me.pre + "command_desc' placeholder='description about my selection' size='30'></td></tr>";
        html += "<tr><td colspan='2' align='center'><button id='" + me.pre + "command_apply'><b>Apply</b></button></td></tr>";
        html += "  </table></td>";

        html += "  <td valign='top'><div>";
        html += "    <b>Atom Selection(s):</b> <br/>";
        html += "    <select id='" + me.pre + "customAtoms' multiple size='3' style='min-width:100px;'>";
        html += "    </select>";
        html += "  </td>";

        html += "  <td valign='top'><div>";
        html += "    <button id='" + me.pre + "show_selected_atom'><span style='white-space:nowrap'><b>Display Selection</b></span></button>";
        html += "  </div></td></tr>";

        html += "  <tr><td colspan='3'>(Script format: select [select] | name [name] | description [description])</td></tr></table>";

        html += "</div>";

        html += "<div id='" + me.pre + "dl_pdbid'>";
        html += "PDB ID: <input type='text' id='" + me.pre + "pdbid' value='2POR' size=8> ";
        html += "<button id='" + me.pre + "reload_pdb'>Load</button>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_pdbfile'>";
        html += "PDB File: <input type='file' id='" + me.pre + "pdbfile' value='2POR' size=8> ";
        html += "<button id='" + me.pre + "reload_pdbfile'>Load</button>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_mmcifid'>";
        html += "mmCIF ID: <input type='text' id='" + me.pre + "mmcifid' value='2POR' size=8> ";
        html += "<button id='" + me.pre + "reload_mmcif'>Load</button>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_mmdbid'>";
        html += "MMDB ID: <input type='text' id='" + me.pre + "mmdbid' value='2POR' size=8> ";
        html += "<button id='" + me.pre + "reload_mmdb'>Load</button>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_gi'>";
        html += "Protein gi: <input type='text' id='" + me.pre + "gi' value='827343227' size=8> ";
        html += "<button id='" + me.pre + "reload_gi'>Load</button>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_cid'>";
        html += "PubChem CID: <input type='text' id='" + me.pre + "cid' value='2244' size=8> ";
        html += "<button id='" + me.pre + "reload_cid'>Load</button>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_state'>";
        html += "State file: <input type='file' id='" + me.pre + "state'><br/>";
        html += "<button id='" + me.pre + "reload_state' style='margin-top: 6px;'>Load</button>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_color'>";
        html += "Custom Color: <input type='text' id='" + me.pre + "color' value='#FF0000' size=8> ";
        html += "<button id='" + me.pre + "applycustomcolor'>Apply</button>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_hbonds'>";
        html += "  <span style='white-space:nowrap;'>Threshold: <select id='" + me.pre + "hbondthreshold'>";
        html += "  <option value='3.2'>3.2</option>";
        html += "  <option value='3.3'>3.3</option>";
        html += "  <option value='3.4'>3.4</option>";
        html += "  <option value='3.5' selected>3.5</option>";
        html += "  <option value='3.6'>3.6</option>";
        html += "  <option value='3.7'>3.7</option>";
        html += "  <option value='3.8'>3.8</option>";
        html += "  <option value='3.9'>3.9</option>";
        html += "  <option value='4.0'>4.0</option>";
        html += "  </select> &#197;</span><br/>";
        html += "  <span style='white-space:nowrap'><button id='" + me.pre + "applyhbonds'>Display</button></span>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_aroundsphere'";
        html += "  <span style='white-space:nowrap'>1. Sphere with a radius: <input type='text' id='" + me.pre + "radius_aroundsphere' value='5' size='2'> &#197;</span><br/>";
        html += "  <span style='white-space:nowrap'>2. <button id='" + me.pre + "applypick_aroundsphere'>Display</button> the sphere around currently selected atoms</span>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_select_chain'>";

        html += "    <table><tr valign='center'>";

        html += "        <td valign='top'><b>Structure:</b><br/>";
        html += "        <select id='" + me.pre + "structureid2' multiple size='3' style='min-width:50px;'>";
        html += "        </select></td>";

        html += "        <td valign='top'><b>Chain:</b><br/>";
        html += "        <select id='" + me.pre + "chainid2' multiple size='3' style='min-width:50px;'>";
        html += "        </select></td>";

        if(me.cfg.align !== undefined) {
            html += "        <td valign='top'><b>Aligned:</b><br/>";
            html += "        <select id='" + me.pre + "alignChainid2' multiple size='3' style='min-width:50px;'>";
            html += "        </select></td>";
        }

        html += "        <td valign='top'><b>Custom:</b><br/>";
        html += "        <select id='" + me.pre + "customResidues2' multiple size='3' style='min-width:50px;'>";
        html += "        </select></td>";

        html += "    </tr></table>";

        html += "</div>";

        html += "<div id='" + me.pre + "dl_addlabel'>";
        html += "1. Text: <input type='text' id='" + me.pre + "labeltext' value='Text' size=4><br/>";
        html += "2. Size: <input type='text' id='" + me.pre + "labelsize' value='40' size=4><br/>";
        html += "3. Color: <input type='text' id='" + me.pre + "labelcolor' value='#ffff00' size=4><br/>";
        html += "4. Background: <input type='text' id='" + me.pre + "labelbkgd' value='#cccccc' size=4><br/>";
        html += "<span style='white-space:nowrap'>5. Pick TWO atoms</span><br/>";
        html += "<span style='white-space:nowrap'>6. <button id='" + me.pre + "applypick_labels'>Display</button></span>";
        html += "</div>";

        html += "<div id='" + me.pre + "dl_distance'>";
        html += "  <span style='white-space:nowrap'>1. Pick TWO atoms</span><br/>";
        html += "  <span style='white-space:nowrap'>2. <button id='" + me.pre + "applypick_measuredistance'>Display</button></span>";
        html += "</div>";

        html += "</div>";
        html += "<!--/form-->";

        $( "#" + id).html(html);

        // menu display
        $("accordion").accordion({ collapsible: true, active: false, heightStyle: "content"});
        $("accordion div").removeClass("ui-accordion-content ui-corner-all ui-corner-bottom ui-widget-content");

        $(".menu").menu({position: { my: "left top", at: "right top" }});
        $(".menu").hover(function(){},function(){$("accordion").accordion( "option", "active", "none");});

        $("#" + me.pre + "accordion1").hover( function(){ $("#" + me.pre + "accordion1 div").css("display", "block"); }, function(){ $("#" + me.pre + "accordion1 div").css("display", "none"); } );

        $("#" + me.pre + "accordion2").hover( function(){ $("#" + me.pre + "accordion2 div").css("display", "block"); }, function(){ $("#" + me.pre + "accordion2 div").css("display", "none"); } );

        $("#" + me.pre + "accordion3").hover( function(){ $("#" + me.pre + "accordion3 div").css("display", "block"); }, function(){ $("#" + me.pre + "accordion3 div").css("display", "none"); } );

        $("#" + me.pre + "accordion4").hover( function(){ $("#" + me.pre + "accordion4 div").css("display", "block"); }, function(){ $("#" + me.pre + "accordion4 div").css("display", "none"); } );

        $("#" + me.pre + "accordion5").hover( function(){ $("#" + me.pre + "accordion5 div").css("display", "block"); }, function(){ $("#" + me.pre + "accordion5 div").css("display", "none"); } );

        $("#" + me.pre + "accordion6").hover( function(){ $("#" + me.pre + "accordion6 div").css("display", "block"); }, function(){ $("#" + me.pre + "accordion6 div").css("display", "none"); } );
    },
    // ====== functions end ===============

    // ====== events start ===============
    // back and forward arrows
    clickBack: function() { var me = this;
        $("#" + me.pre + "back").add("#" + me.pre + "menu6_back").click(function(e) {
           e.preventDefault();

           me.setLogCommand("back", false);
           me.back();
        });
    },

    clickForward: function() { var me = this;
        $("#" + me.pre + "forward").add("#" + me.pre + "menu6_forward").click(function(e) {
           e.preventDefault();

           me.setLogCommand("forward", false);
           me.forward();
        });
    },

    clickToggle: function() { var me = this;
        $("#" + me.pre + "toggle").add("#" + me.pre + "menu2_toggle").click(function(e) {
    //       e.preventDefault();

           me.setLogCommand("toggle selected atoms", true);
           me.toggleSelection();
        });
    },

    clickHlColorYellow: function() { var me = this;
        $("#" + me.pre + "menu2_hl_colorYellow").click(function(e) {
    //       e.preventDefault();

           me.setLogCommand("set highlight color yellow", true);
           me.icn3d.highlightColor = new THREE.Color(0xFFFF00);
           me.icn3d.matShader = me.icn3d.setOutlineColor('yellow');
           me.icn3d.draw(); // required to make it work properly
        });
    },

    clickHlColorGreen: function() { var me = this;
        $("#" + me.pre + "menu2_hl_colorGreen").click(function(e) {
    //       e.preventDefault();

           me.setLogCommand("set highlight color green", true);
           me.icn3d.highlightColor = new THREE.Color(0x00FF00);
           me.icn3d.matShader = me.icn3d.setOutlineColor('green');
           me.icn3d.draw(); // required to make it work properly
        });
    },

    clickHlColorRed: function() { var me = this;
        $("#" + me.pre + "menu2_hl_colorRed").click(function(e) {
    //       e.preventDefault();

           me.setLogCommand("set highlight color red", true);
           me.icn3d.highlightColor = new THREE.Color(0xFF0000);
           me.icn3d.matShader = me.icn3d.setOutlineColor('red');
           me.icn3d.draw(); // required to make it work properly
        });
    },

    clickHlStyleOutline: function() { var me = this;
        $("#" + me.pre + "menu2_hl_styleOutline").click(function(e) {
    //       e.preventDefault();

           me.setLogCommand("set highlight style outline", true);
           me.icn3d.bHighlight = 1;

           me.icn3d.draw();
        });
    },

    clickHlStyleObject: function() { var me = this;
        $("#" + me.pre + "menu2_hl_styleObject").click(function(e) {
    //       e.preventDefault();

           me.setLogCommand("set highlight style object", true);
           me.icn3d.bHighlight = 2;

           me.icn3d.draw();
        });
    },

    clickAlternate: function() { var me = this;
        $("#" + me.pre + "alternate").add("#" + me.pre + "menu2_alternate").click(function(e) {
    //       e.preventDefault();

           me.setLogCommand("alternate structures", false);
           me.alternateStructures();
        });
    },

    //menu 1
    clickMenu1_pdbid: function() { var me = this;
        $("#" + me.pre + "menu1_pdbid").click(function(e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_pdbid', 'Please input PDB ID');
        });
    },

    clickMenu1_pdbfile: function() { var me = this;
        $("#" + me.pre + "menu1_pdbfile").click(function(e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_pdbfile', 'Please input PDB File');
        });
    },

    clickMenu1_mmcifid: function() { var me = this;
        $("#" + me.pre + "menu1_mmcifid").click(function(e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_mmcifid', 'Please input mmCIF ID');
        });
    },

    clickMenu1_mmdbid: function() { var me = this;
        $("#" + me.pre + "menu1_mmdbid").click(function(e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_mmdbid', 'Please input MMDB ID');
        });
    },

    clickMenu1_gi: function() { var me = this;
        $("#" + me.pre + "menu1_gi").click(function(e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_gi', 'Please input protein gi');
        });
    },

    clickMenu1_cid: function() { var me = this;
        $("#" + me.pre + "menu1_cid").click(function(e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_cid', 'Please input PubChem CID');
        });
    },

    clickMenu1_state: function() { var me = this;
        $("#" + me.pre + "menu1_state").click(function(e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_state', 'Please input the state file');
        });
    },

    clickMenu1_exportState: function() { var me = this;
        $("#" + me.pre + "menu1_exportState").click(function (e) {
           //e.preventDefault();

           me.setLogCommand("export state file", false);

           //me.exportState();
           me.saveFile(me.inputid + '_statefile.txt', 'text');
        });
    },

    clickMenu1_exportCanvas: function() { var me = this;
        $("#" + me.pre + "menu1_exportCanvas").click(function (e) {
           //e.preventDefault();

           me.setLogCommand("export canvas", false);

           //me.icn3d.exportCanvas();
           me.saveFile(me.inputid + '_image.png', 'png');
        });
    },

    clickMenu1_link_structure: function() { var me = this;
        $("#" + me.pre + "menu1_link_structure").click(function (e) {
           //e.preventDefault();

           var url = "//www.ncbi.nlm.nih.gov/structure/?term=" + me.inputid;


           me.setLogCommand("link to search structure " + me.inputid + ": " + url, false);

           //me.exportState();
           window.open(url, '_blank');
        });
    },

    clickMenu1_link_vast: function() { var me = this;
        $("#" + me.pre + "menu1_link_vast").click(function (e) {
           //e.preventDefault();

           var url = "//www.ncbi.nlm.nih.gov/Structure/vastplus/vastplus.cgi?uid=" + me.inputid;

           me.setLogCommand("link to structures similar to " + me.inputid + ": " + url, false);

           window.open(url, '_blank');
        });
    },

    clickMenu1_link_pubmed: function() { var me = this;
        $("#" + me.pre + "menu1_link_pubmed").click(function (e) {
           //e.preventDefault();

           var url;
           if(me.pmid !== undefined) {
               url = "//www.ncbi.nlm.nih.gov/pubmed/" + me.pmid;
           }
           else {
               url = "//www.ncbi.nlm.nih.gov/pubmed/?term=" + me.inputid;
           }

           me.setLogCommand("link to literature about " + me.inputid + ": " + url, false);

           window.open(url, '_blank');
        });
    },

    // menu 2
    clickMenu2_selectresidues: function() { var me = this;
        $("#" + me.pre + "menu2_selectresidues").click(function (e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_selectresidues', 'Select residues in sequences with coordinates');
        });
    },

    selectAll: function() { var me = this;
           me.icn3d.highlightAtoms = {};

           for(var i in me.icn3d.chains) {
               me.icn3d.highlightAtoms = me.icn3d.unionHash(me.icn3d.highlightAtoms, me.icn3d.chains[i]);
           }

           me.icn3d.removeHighlightObjects();

           var seqObj = me.getSequencesAnnotations(Object.keys(me.icn3d.chains));
           $("#" + me.pre + "dl_sequence").html(seqObj.sequencesHtml);
           $("#" + me.pre + "dl_sequence").width(me.RESIDUE_WIDTH * seqObj.maxSeqCnt + 200);

           me.icn3d.addHighlightObjects();
    },

    clickMenu2_selectall: function() { var me = this;
        $("#" + me.pre + "menu2_selectall").add("#" + me.pre + "selectall").click(function (e) {
           //e.preventDefault();

           me.setLogCommand("select all", true);

           me.selectAll();
        });
    },

    selectComplement: function() { var me = this;
               var complement = {};
               var residuesHash = {};
               var residueid;

               for(var i in me.icn3d.atoms) {
                   if(!me.icn3d.highlightAtoms.hasOwnProperty(i)) {
                       complement[i] = 1;
                       residueid = me.icn3d.atoms[i].structure + '_' + me.icn3d.atoms[i].chain + '_' + me.icn3d.atoms[i].resi;
                       residuesHash[residueid] = 1;
                   }
               }

               me.icn3d.highlightAtoms = {};
               me.icn3d.cloneHash(complement, me.icn3d.highlightAtoms);

               me.icn3d.removeHighlightObjects();

               var sequencesHtml = "<b>Annotation(s):</b> Complement of the current selection<br/>";

               var chainArray = [];
               for(var chain in me.icn3d.chains) {
                   chainArray.push(chain);
               }

               var seqObj = me.getSequencesAnnotations(chainArray, false, Object.keys(residuesHash));
               $("#" + me.pre + "dl_sequence").html(sequencesHtml + seqObj.sequencesHtml);
               $("#" + me.pre + "dl_sequence").width(me.RESIDUE_WIDTH * seqObj.maxSeqCnt + 200);

               me.icn3d.addHighlightObjects();
    },

    clickMenu2_selectcomplement: function() { var me = this;
        $("#" + me.pre + "menu2_selectcomplement").click(function (e) {
           //e.preventDefault();

           if(Object.keys(me.icn3d.highlightAtoms).length < Object.keys(me.icn3d.atoms).length) {
               me.setLogCommand("select complement", true);

               me.selectComplement();
           }
        });
    },

    clickMenu2_alignment: function() { var me = this;
        $("#" + me.pre + "menu2_alignment").click(function (e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_alignment', 'Select residues in aligned sequences');
        });
    },

    clickMenu2_command: function() { var me = this;
        $("#" + me.pre + "menu2_command").click(function (e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_command', 'Use command to define selections');
        });
    },

    clickMenu2_pickingYes: function() { var me = this;
        $("#" + me.pre + "menu2_pickingYes").click(function (e) {
           //e.preventDefault();

           //setOption('picking', 'yes');
           me.icn3d.picking = 1;
           me.icn3d.options['picking'] = 'atom';
           me.setLogCommand('picking yes', true);
        });
    },

    clickMenu2_pickingNo: function() { var me = this;
        $("#" + me.pre + "menu2_pickingNo").click(function (e) {
           //e.preventDefault();

           //setOption('picking', 'no');
           me.icn3d.picking = 0;
           me.icn3d.options['picking'] = 'no';
           me.setLogCommand('picking no', true);

           me.icn3d.draw(undefined, undefined);
           me.icn3d.removeHighlightObjects();
        });
    },

    clickMenu2_pickingResidue: function() { var me = this;
        $("#" + me.pre + "menu2_pickingResidue").click(function (e) {
           //e.preventDefault();

           //setOption('picking', 'yes');
           me.icn3d.picking = 2;
           me.icn3d.options['picking'] = 'atom';
           me.setLogCommand('picking residue', true);
        });
    },

    clickMenu2_aroundsphere: function() { var me = this;
        $("#" + me.pre + "menu2_aroundsphere").click(function (e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_aroundsphere', 'Select a sphere around current selection');
        });
    },

    clickMenu2_select_chain: function() { var me = this;
        $("#" + me.pre + "menu2_select_chain").click(function (e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_select_chain', 'Select Structure/Chain/Custom Selection');
        });
    },

    // menu 3
    clickMenu3_proteinRibbon: function() { var me = this;
        $("#" + me.pre + "menu3_proteinRibbon").click(function (e) {
           //e.preventDefault();

           me.setStyle('protein', 'ribbon');
           me.setLogCommand('style protein ribbon', true);
        });
    },

    clickMenu3_proteinStrand: function() { var me = this;
        $("#" + me.pre + "menu3_proteinStrand").click(function (e) {
           //e.preventDefault();

           me.setStyle('protein', 'strand');
           me.setLogCommand('style protein strand', true);
        });
    },

    clickMenu3_proteinCylinder: function() { var me = this;
        $("#" + me.pre + "menu3_proteinCylinder").click(function (e) {
           //e.preventDefault();

           me.setStyle('protein', 'cylinder & plate');
           me.setLogCommand('style protein cylinder & plate', true);
        });
    },

    clickMenu3_proteinCalpha: function() { var me = this;
        $("#" + me.pre + "menu3_proteinCalpha").click(function (e) {
           //e.preventDefault();

           me.setStyle('protein', 'C alpha trace');
           me.setLogCommand('style protein C alpha trace', true);
        });
    },

    clickMenu3_proteinBfactor: function() { var me = this;
        $("#" + me.pre + "menu3_proteinBfactor").click(function (e) {
           //e.preventDefault();

           me.setStyle('protein', 'B factor tube');
           me.setLogCommand('style protein B factor tube', true);
        });
    },

    clickMenu3_proteinLines: function() { var me = this;
        $("#" + me.pre + "menu3_proteinLines").click(function (e) {
           //e.preventDefault();

           me.setStyle('protein', 'lines');
           me.setLogCommand('style protein lines', true);
        });
    },

    clickMenu3_proteinStick: function() { var me = this;
        $("#" + me.pre + "menu3_proteinStick").click(function (e) {
           //e.preventDefault();

           me.setStyle('protein', 'stick');
           me.setLogCommand('style protein stick', true);
        });
    },

    clickMenu3_proteinBallstick: function() { var me = this;
        $("#" + me.pre + "menu3_proteinBallstick").click(function (e) {
           //e.preventDefault();

           me.setStyle('protein', 'ball & stick');
           me.setLogCommand('style protein ball & stick', true);
        });
    },

    clickMenu3_proteinSphere: function() { var me = this;
        $("#" + me.pre + "menu3_proteinSphere").click(function (e) {
           //e.preventDefault();

           me.setStyle('protein', 'sphere');
           me.setLogCommand('style protein sphere', true);
        });
    },

    clickMenu3_proteinNothing: function() { var me = this;
        $("#" + me.pre + "menu3_proteinNothing").click(function (e) {
           //e.preventDefault();

           me.setStyle('protein', 'nothing');
           me.setLogCommand('style protein nothing', true);
        });
    },

    clickmenu3_nuclCartoon: function() { var me = this;
        $("#" + me.pre + "menu3_nuclCartoon").click(function (e) {
           //e.preventDefault();

           me.setStyle('nucleotides', 'nucleotide cartoon');
           me.setLogCommand('style nucleotides nucleotide cartoon', true);
        });
    },

    clickmenu3_nuclPhos: function() { var me = this;
        $("#" + me.pre + "menu3_nuclPhos").click(function (e) {
           //e.preventDefault();

           me.setStyle('nucleotides', 'phosphorus trace');
           me.setLogCommand('style nucleotides phosphorus trace', true);
        });
    },

    clickmenu3_nuclLines: function() { var me = this;
        $("#" + me.pre + "menu3_nuclLines").click(function (e) {
           //e.preventDefault();

           me.setStyle('nucleotides', 'lines');
           me.setLogCommand('style nucleotides lines', true);
        });
    },

    clickmenu3_nuclStick: function() { var me = this;
        $("#" + me.pre + "menu3_nuclStick").click(function (e) {
           //e.preventDefault();

           me.setStyle('nucleotides', 'stick');
           me.setLogCommand('style nucleotides stick', true);
        });
    },

    clickmenu3_nuclBallstick: function() { var me = this;
        $("#" + me.pre + "menu3_nuclBallstick").click(function (e) {
           //e.preventDefault();

           me.setStyle('nucleotides', 'ball & stick');
           me.setLogCommand('style nucleotides ball & stick', true);
        });
    },

    clickmenu3_nuclSphere: function() { var me = this;
        $("#" + me.pre + "menu3_nuclSphere").click(function (e) {
           //e.preventDefault();

           me.setStyle('nucleotides', 'sphere');
           me.setLogCommand('style nucleotides sphere', true);
        });
    },

    clickmenu3_nuclNothing: function() { var me = this;
        $("#" + me.pre + "menu3_nuclNothing").click(function (e) {
           //e.preventDefault();

           me.setStyle('nucleotides', 'nothing');
           me.setLogCommand('style nucleotides nothing', true);
        });
    },

    clickMenu3_ligandsLines: function() { var me = this;
        $("#" + me.pre + "menu3_ligandsLines").click(function (e) {
           //e.preventDefault();

           me.setStyle('ligands', 'lines');
           me.setLogCommand('style ligands lines', true);
        });
    },

    clickMenu3_ligandsStick: function() { var me = this;
        $("#" + me.pre + "menu3_ligandsStick").click(function (e) {
           //e.preventDefault();

           me.setStyle('ligands', 'stick');
           me.setLogCommand('style ligands stick', true);
        });
    },

    clickMenu3_ligandsBallstick: function() { var me = this;
        $("#" + me.pre + "menu3_ligandsBallstick").click(function (e) {
           //e.preventDefault();

           me.setStyle('ligands', 'ball & stick');
           me.setLogCommand('style ligands ball & stick', true);
        });
    },

    clickMenu3_ligandsSphere: function() { var me = this;
        $("#" + me.pre + "menu3_ligandsSphere").click(function (e) {
           //e.preventDefault();

           me.setStyle('ligands', 'sphere');
           me.setLogCommand('style ligands sphere', true);
        });
    },

    clickMenu3_ligandsNothing: function() { var me = this;
        $("#" + me.pre + "menu3_ligandsNothing").click(function (e) {
           //e.preventDefault();

           me.setStyle('ligands', 'nothing');
           me.setLogCommand('style ligands nothing', true);
        });
    },

    clickMenu3_ionsSphere: function() { var me = this;
        $("#" + me.pre + "menu3_ionsSphere").click(function (e) {
           //e.preventDefault();

           me.setStyle('ions', 'sphere');
           me.setLogCommand('style ions sphere', true);
        });
    },

    clickMenu3_ionsDot: function() { var me = this;
        $("#" + me.pre + "menu3_ionsDot").click(function (e) {
           //e.preventDefault();

           me.setStyle('ions', 'dot');
           me.setLogCommand('style ions dot', true);
        });
    },

    clickMenu3_ionsNothing: function() { var me = this;
        $("#" + me.pre + "menu3_ionsNothing").click(function (e) {
           //e.preventDefault();

           me.setStyle('ions', 'nothing');
           me.setLogCommand('style ions nothing', true);
        });
    },

    clickMenu3_waterSphere: function() { var me = this;
        $("#" + me.pre + "menu3_waterSphere").click(function (e) {
           //e.preventDefault();

           me.setStyle('water', 'sphere');
           me.setLogCommand('style water sphere', true);
        });
    },

    clickMenu3_waterDot: function() { var me = this;
        $("#" + me.pre + "menu3_waterDot").click(function (e) {
           //e.preventDefault();

           me.setStyle('water', 'dot');
           me.setLogCommand('style water dot', true);
        });
    },

    clickMenu3_waterNothing: function() { var me = this;
        $("#" + me.pre + "menu3_waterNothing").click(function (e) {
           //e.preventDefault();

           me.setStyle('water', 'nothing');
           me.setLogCommand('style water nothing', true);
        });
    },

    // menu 4
    clickMenu4_colorSpectrum: function() { var me = this;
        $("#" + me.pre + "menu4_colorSpectrum").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'spectrum');
           me.setLogCommand('color spectrum', true);
        });
    },

    clickMenu4_colorChain: function() { var me = this;
        $("#" + me.pre + "menu4_colorChain").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'chain');
           me.setLogCommand('color chain', true);
        });
    },

    clickMenu4_colorSS: function() { var me = this;
        $("#" + me.pre + "menu4_colorSS").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'secondary structure');
           me.setLogCommand('color secondary structure', true);
        });
    },

    clickMenu4_colorBfactor: function() { var me = this;
        $("#" + me.pre + "menu4_colorBfactor").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'B factor');
           me.setLogCommand('color B factor', true);
        });
    },

    clickMenu4_colorResidue: function() { var me = this;
        $("#" + me.pre + "menu4_colorResidue").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'residue');
           me.setLogCommand('color residue', true);
        });
    },

    clickMenu4_colorPolarity: function() { var me = this;
        $("#" + me.pre + "menu4_colorPolarity").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'polarity');
           me.setLogCommand('color polarity', true);
        });
    },

    clickMenu4_colorAtom: function() { var me = this;
        $("#" + me.pre + "menu4_colorAtom").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'atom');
           me.setLogCommand('color atom', true);
        });
    },

    clickMenu4_colorRed: function() { var me = this;
        $("#" + me.pre + "menu4_colorRed").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'red');
           me.setLogCommand('color red', true);
        });
    },

    clickMenu4_colorGreen: function() { var me = this;
        $("#" + me.pre + "menu4_colorGreen").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'green');
           me.setLogCommand('color green', true);
        });
    },

    clickMenu4_colorBlue: function() { var me = this;
        $("#" + me.pre + "menu4_colorBlue").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'blue');
           me.setLogCommand('color blue', true);
        });
    },

    clickMenu4_colorMagenta: function() { var me = this;
        $("#" + me.pre + "menu4_colorMagenta").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'magenta');
           me.setLogCommand('color magenta', true);
        });
    },

    clickMenu4_colorYellow: function() { var me = this;
        $("#" + me.pre + "menu4_colorYellow").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'yellow');
           me.setLogCommand('color yellow', true);
        });
    },

    clickMenu4_colorCyan: function() { var me = this;
        $("#" + me.pre + "menu4_colorCyan").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'cyan');
           me.setLogCommand('color cyan', true);
        });
    },

    clickMenu4_colorWhite: function() { var me = this;
        $("#" + me.pre + "menu4_colorWhite").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'white');
           me.setLogCommand('color white', true);
        });
    },

    clickMenu4_colorGrey: function() { var me = this;
        $("#" + me.pre + "menu4_colorGrey").click(function (e) {
           //e.preventDefault();

           me.setOption('color', 'grey');
           me.setLogCommand('color grey', true);
        });
    },

    clickMenu4_colorCustom: function() { var me = this;
        $("#" + me.pre + "menu4_colorCustom").click(function (e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_color', 'Choose custom color');
        });
    },

    // menu 5
    clickMenu5_showsurfaceYes: function() { var me = this;
        $("#" + me.pre + "menu5_showsurfaceYes").click(function (e) {
           //e.preventDefault();

           me.setOption('showsurface', 'yes');
           me.setLogCommand('showsurface yes', true);
        });
    },

    clickMenu5_showsurfaceNo: function() { var me = this;
        $("#" + me.pre + "menu5_showsurfaceNo").click(function (e) {
           //e.preventDefault();

           me.setOption('showsurface', 'no');
           me.setLogCommand('showsurface no', true);
        });
    },

    clickMenu5_surfaceVDW: function() { var me = this;
        $("#" + me.pre + "menu5_surfaceVDW").click(function (e) {
           //e.preventDefault();

           me.setOption('surface', 'Van der Waals surface');
           me.setLogCommand('surface Van der Waals surface', true);
        });
    },

    clickMenu5_surfaceSES: function() { var me = this;
        $("#" + me.pre + "menu5_surfaceSES").click(function (e) {
           //e.preventDefault();

           me.setOption('surface', 'solvent excluded surface');
           me.setLogCommand('surface solvent excluded surface', true);
        });
    },

    clickMenu5_surfaceSAS: function() { var me = this;
        $("#" + me.pre + "menu5_surfaceSAS").click(function (e) {
           //e.preventDefault();

           me.setOption('surface', 'solvent accessible surface');
           me.setLogCommand('surface solvent accessible surface', true);
        });
    },

    clickMenu5_surfaceMolecular: function() { var me = this;
        $("#" + me.pre + "menu5_surfaceMolecular").click(function (e) {
           //e.preventDefault();

           me.setOption('surface', 'molecular surface');
           me.setLogCommand('surface molecular surface', true);
        });
    },

    clickMenu5_surfaceNothing: function() { var me = this;
        $("#" + me.pre + "menu5_surfaceNothing").click(function (e) {
           //e.preventDefault();

           me.setOption('surface', 'nothing');
           me.setLogCommand('surface nothing', true);
        });
    },

    clickMenu5_opacity10: function() { var me = this;
        $("#" + me.pre + "menu5_opacity10").click(function (e) {
           //e.preventDefault();

           me.setOption('opacity', '1.0');
           me.setLogCommand('opacity 1.0', true);
        });
    },

    clickMenu5_opacity09: function() { var me = this;
        $("#" + me.pre + "menu5_opacity09").click(function (e) {
           //e.preventDefault();

           me.setOption('opacity', '0.9');
           me.setLogCommand('opacity 0.9', true);
        });
    },

    clickMenu5_opacity08: function() { var me = this;
        $("#" + me.pre + "menu5_opacity08").click(function (e) {
           //e.preventDefault();

           me.setOption('opacity', '0.8');
           me.setLogCommand('opacity 0.8', true);
        });
    },

    clickMenu5_opacity07: function() { var me = this;
        $("#" + me.pre + "menu5_opacity07").click(function (e) {
           //e.preventDefault();

           me.setOption('opacity', '0.7');
           me.setLogCommand('opacity 0.7', true);
        });
    },

    clickMenu5_opacity06: function() { var me = this;
        $("#" + me.pre + "menu5_opacity06").click(function (e) {
           //e.preventDefault();

           me.setOption('opacity', '0.6');
           me.setLogCommand('opacity 0.6', true);
        });
    },

    clickMenu5_opacity05: function() { var me = this;
        $("#" + me.pre + "menu5_opacity05").click(function (e) {
           //e.preventDefault();

           me.setOption('opacity', '0.5');
           me.setLogCommand('opacity 0.5', true);
        });
    },

    clickMenu5_wireframeYes: function() { var me = this;
        $("#" + me.pre + "menu5_wireframeYes").click(function (e) {
           //e.preventDefault();

           me.setOption('wireframe', 'yes');
           me.setLogCommand('wireframe yes', true);
        });
    },

    clickMenu5_wireframeNo: function() { var me = this;
        $("#" + me.pre + "menu5_wireframeNo").click(function (e) {
           //e.preventDefault();

           me.setOption('wireframe', 'no');
           me.setLogCommand('wireframe no', true);
        });
    },

    // menu 6
    clickMenu6_assemblyYes: function() { var me = this;
        $("#" + me.pre + "menu6_assemblyYes").click(function (e) {
           //e.preventDefault();

           me.icn3d.bAssembly = true;
           me.setLogCommand('assembly yes', true);
           me.icn3d.draw();
        });
    },

    clickMenu6_assemblyNo: function() { var me = this;
        $("#" + me.pre + "menu6_assemblyNo").click(function (e) {
           //e.preventDefault();

           me.icn3d.bAssembly = false;
           me.setLogCommand('assembly no', true);
           me.icn3d.draw();
        });
    },

    clickMenu6_addlabelYes: function() { var me = this;
        $("#" + me.pre + "menu6_addlabelYes").click(function (e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_addlabel', 'Add custom labels');
           me.icn3d.picking = 1;
           me.icn3d.pickpair = true;
           me.icn3d.pickedatomNum = 0;
        });
    },

    clickMenu6_addlabelNo: function() { var me = this;
        $("#" + me.pre + "menu6_addlabelNo").click(function (e) {
           //e.preventDefault();

           //me.icn3d.picking = 1;
           me.icn3d.pickpair = false;
           //me.icn3d.pickedatomNum = 0;

           var select = "show label no";
           me.setLogCommand(select, true);

            me.options["labels"] = "no";
            me.icn3d.draw(me.options);

        });
    },

    clickMenu6_distanceYes: function() { var me = this;
        $("#" + me.pre + "menu6_distanceYes").click(function (e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_distance', 'Measure the distance of atoms');
           me.icn3d.picking = 1;
           me.icn3d.pickpair = true;
           me.icn3d.pickedatomNum = 0;
        });
    },

    clickMenu6_distanceNo: function() { var me = this;
        $("#" + me.pre + "menu6_distanceNo").click(function (e) {
           //e.preventDefault();

           //me.icn3d.picking = 1;
           me.icn3d.pickpair = false;
           //me.icn3d.pickedatomNum = 0;

           var select = "show distance no";
           me.setLogCommand(select, true);

            me.options["lines"] = "no";
            me.icn3d.draw(me.options);
        });
    },

    clickMenu6_selectedcenter: function() { var me = this;
        $("#" + me.pre + "menu6_selectedcenter").add("#" + me.pre + "zoomin_selection").click(function (e) {
           //e.preventDefault();

           me.setLogCommand('zoomin selected atoms', true);

           me.icn3d.zoominSelection();
        });
    },

    clickMenu6_rotateleft: function() { var me = this;
        $("#" + me.pre + "menu6_rotateleft").click(function (e) {
           //e.preventDefault();
           me.setLogCommand('rotate left', true);

           me.icn3d.bStopRotate = false;
           me.ROTATION_DIRECTION = 'left';

           me.rotateStructure('left');
        });
    },

    clickMenu6_rotateright: function() { var me = this;
        $("#" + me.pre + "menu6_rotateright").click(function (e) {
           //e.preventDefault();

           me.setLogCommand('rotate right', true);

           me.icn3d.bStopRotate = false;
           me.ROTATION_DIRECTION = 'right';

           me.rotateStructure('right');
        });
    },

    clickMenu6_rotateup: function() { var me = this;
        $("#" + me.pre + "menu6_rotateup").click(function (e) {
           //e.preventDefault();

           me.setLogCommand('rotate up', true);

           me.icn3d.bStopRotate = false;
           me.ROTATION_DIRECTION = 'up';

           me.rotateStructure('up');
        });
    },

    clickMenu6_rotatedown: function() { var me = this;
        $("#" + me.pre + "menu6_rotatedown").click(function (e) {
           //e.preventDefault();

           me.setLogCommand('rotate down', true);

           me.icn3d.bStopRotate = false;
           me.ROTATION_DIRECTION = 'down';

           me.rotateStructure('down');
        });
    },

    clickMenu6_cameraPers: function() { var me = this;
        $("#" + me.pre + "menu6_cameraPers").click(function (e) {
           //e.preventDefault();

           me.setOption('camera', 'perspective');
           me.setLogCommand('camera perspective', true);
        });
    },

    clickMenu6_cameraOrth: function() { var me = this;
        $("#" + me.pre + "menu6_cameraOrth").click(function (e) {
           //e.preventDefault();

           me.setOption('camera', 'orthographic');
           me.setLogCommand('camera orthographic', true);
        });
    },

    clickMenu6_bkgdBlack: function() { var me = this;
        $("#" + me.pre + "menu6_bkgdBlack").click(function (e) {
           //e.preventDefault();

           me.setOption('background', 'black');
           me.setLogCommand('background black', true);
        });
    },

    clickMenu6_bkgdGrey: function() { var me = this;
        $("#" + me.pre + "menu6_bkgdGrey").click(function (e) {
           //e.preventDefault();

           me.setOption('background', 'grey');
           me.setLogCommand('background grey', true);
        });
    },

    clickMenu6_bkgdWhite: function() { var me = this;
        $("#" + me.pre + "menu6_bkgdWhite").click(function (e) {
           //e.preventDefault();

           me.setOption('background', 'white');
           me.setLogCommand('background white', true);
        });
    },

    clickMenu6_showaxisYes: function() { var me = this;
        $("#" + me.pre + "menu6_showaxisYes").click(function (e) {
           //e.preventDefault();

           me.setOption('axis', 'yes');
           me.setLogCommand('showaxis yes', true);
        });
    },

    clickMenu6_showaxisNo: function() { var me = this;
        $("#" + me.pre + "menu6_showaxisNo").click(function (e) {
           //e.preventDefault();

           me.setOption('axis', 'no');
           me.setLogCommand('showaxis no', true);
        });
    },

    clickMenu6_hbondsYes: function() { var me = this;
        $("#" + me.pre + "menu6_hbondsYes").click(function (e) {
           //e.preventDefault();

           me.openDialog(me.pre + 'dl_hbonds', 'Hydrogen Bonds');
        });
    },

    clickMenu6_hbondsNo: function() { var me = this;
        $("#" + me.pre + "menu6_hbondsNo").click(function (e) {
           //e.preventDefault();

           var select = "show hbonds no";
           me.setLogCommand(select, true);

            me.options["hbonds"] = "no";
            me.options["lines"] = "no";
            me.icn3d.draw(me.options);
        });
    },

    // other
    selectSequenceNonMobile: function() { var me = this;
      $("#" + me.pre + "dl_sequence").selectable({
          stop: function() {
              // reset original color
              //me.icn3d.setColorByOptions(me.options, me.icn3d.atoms);

              $("#" + me.pre + "chainid").val("");
              $("#" + me.pre + "structureid").val("");

              $("#" + me.pre + "chainid2").val("");
              $("#" + me.pre + "structureid2").val("");

              // select residues
              $(".ui-selected", this).each(function() {
                  var id = $(this).attr('id');
                  if(id !== undefined && id !== '') {
                      if(me.SELECT_RESIDUE === false) {
                            me.removeSeqChainBkgd();
                            me.removeSeqResidueBkgd();

                          me.icn3d.removeHighlightObjects();
                          me.icn3d.highlightAtoms = {};

                          me.SELECT_RESIDUE = true;
                          me.selectedResidues = {};
                          me.icn3d.highlightAtoms = {};

                          me.commanddesc = "seq_" + id.substr(id.indexOf('_') + 1);
                      }

                    $(this).toggleClass('highlightSeq');

                    var residueid = id.substr(id.indexOf('_') + 1);
                    if($(this).hasClass('highlightSeq')) {
                      //atom.color = new THREE.Color(0xFFFF00);

                      me.selectAResidue(residueid, me.commanddesc);
                      me.selectedResidues[residueid] = 1;
                    }

                    for (var i in me.icn3d.residues[residueid]) {
                        var atom = me.icn3d.atoms[i];

                        if(!$(this).hasClass('highlightSeq')) {
                          //atom.color = me.icn3d.atomPrevColors[i];

                          delete me.icn3d.highlightAtoms[i];
                          me.selectedResidues[residueid] = undefined;
                        }
                    }
                  }
              });

              var options2 = {};
              //options2['color'] = 'custom';

              //me.icn3d.draw(options2, false);
              me.icn3d.addHighlightObjects();

              // reset original color
              //me.icn3d.setColorByOptions(me.options, me.icn3d.atoms);

              $("#" + me.pre + "chainid").val("");
              $("#" + me.pre + "structureid").val("");

              $("#" + me.pre + "chainid2").val("");
              $("#" + me.pre + "structureid2").val("");

              // select annotation title
              $(".ui-selected", this).each(function() {
                  var currChain = $(this).attr('chain');
                  if($(this).hasClass('seqTitle')) {
                    me.SELECT_RESIDUE = false;
                    me.setLogCommand('select residue ' + Object.keys(me.selectedResidues), true);

                    me.removeSeqChainBkgd(currChain);
                    me.removeSeqResidueBkgd();

                    $(this).toggleClass('highlightSeq');

                    var chainid = $(this).attr('chain');
                    //var anno = $(this).attr('anno'); // annotation ids are from 0 to number of annotations. "anno" is "sequence" for the sequence line
                    //var commanddesc = $(this).text() + " (" + chainid + ")";
                    var commanddesc = "seq_" + $(this).text().trim();

                    if($(this).hasClass('highlightSeq')) {
                        me.selectAChain(chainid, commanddesc);
                        me.setLogCommand('select chain ' + chainid, true);
                    }
                    else {
                        me.icn3d.removeHighlightObjects();

                        me.icn3d.highlightAtoms = {};

                       $("#" + me.pre + "customResidues").val("");
                       $("#" + me.pre + "customResidues2").val("");
                       $("#" + me.pre + "customAtoms").val("");
                    }
                  }
              });

          }
      });

      $("#" + me.pre + "dl_sequence2").selectable({
          stop: function() {
              // reset original color
              //me.icn3d.setColorByOptions(me.options, me.icn3d.atoms);

              $("#" + me.pre + "chainid").val("");
              $("#" + me.pre + "structureid").val("");

              $("#" + me.pre + "chainid2").val("");
              $("#" + me.pre + "structureid2").val("");

              // select residues
              $(".ui-selected", this).each(function() {
                  var id = $(this).attr('id');
                  if(id !== undefined && id !== '') {
                      if(me.SELECT_RESIDUE === false) {
                            me.removeSeqChainBkgd();
                            me.removeSeqResidueBkgd();

                          me.icn3d.removeHighlightObjects();
                          me.icn3d.highlightAtoms = {};

                          me.SELECT_RESIDUE = true;
                          me.selectedResidues = {};
                          me.icn3d.highlightAtoms = {};

                          me.commanddesc = "alignSeq_" + id.substr(id.indexOf('_') + 1);
                      }

                    $(this).toggleClass('highlightSeq');

                    var residueid = id.substr(id.indexOf('_') + 1);
                    if($(this).hasClass('highlightSeq')) {
                      //atom.color = new THREE.Color(0xFFFF00);

                      me.selectAResidue(residueid, me.commanddesc);
                      me.selectedResidues[residueid] = 1;
                    }

                    for (var i in me.icn3d.residues[residueid]) {
                        var atom = me.icn3d.atoms[i];

                        if(!$(this).hasClass('highlightSeq')) {
                          //atom.color = me.icn3d.atomPrevColors[i];

                          delete me.icn3d.highlightAtoms[i];
                          me.selectedResidues[residueid] = undefined;
                        }
                    }
                  }
              });

              var options2 = {};
              //options2['color'] = 'custom';

              //me.icn3d.draw(options2, false);
              me.icn3d.addHighlightObjects();

              // reset original color
              //me.icn3d.setColorByOptions(me.options, me.icn3d.atoms);

              $("#" + me.pre + "chainid").val("");
              $("#" + me.pre + "structureid").val("");

              $("#" + me.pre + "chainid2").val("");
              $("#" + me.pre + "structureid2").val("");

              // select annotation title
              $(".ui-selected", this).each(function() {
                  var currChain = $(this).attr('chain');
                  if($(this).hasClass('seqTitle')) {
                    me.SELECT_RESIDUE = false;
                    me.setLogCommand('select residue ' + Object.keys(me.selectedResidues), true);

                    me.removeSeqChainBkgd(currChain);
                    me.removeSeqResidueBkgd();

                    $(this).toggleClass('highlightSeq');

                    var chainid = $(this).attr('chain');
                    //var anno = $(this).attr('anno'); // annotation ids are from 0 to number of annotations. "anno" is "sequence" for the sequence line
                    //var commanddesc = $(this).text() + " (" + chainid + ")";
                    var commanddesc = "alignSeq_" + $(this).text().trim();

                    if($(this).hasClass('highlightSeq')) {
                        me.selectAAlignChain(chainid, commanddesc);
                        me.setLogCommand('select alignChain ' + chainid, true);
                    }
                    else {
                        me.icn3d.removeHighlightObjects();

                        me.icn3d.highlightAtoms = {};

                       $("#" + me.pre + "customResidues").val("");
                       $("#" + me.pre + "customResidues2").val("");
                       $("#" + me.pre + "customAtoms").val("");
                    }
                  }
              });

          }
      });
    },

    selectSequenceMobile: function() { var me = this;
      $("#" + me.pre + "dl_sequence").add("#" + me.pre + "dl_sequence2").on('click', '.residue', function(e) {
          $("#" + me.pre + "chainid").val("");
          $("#" + me.pre + "structureid").val("");

          $("#" + me.pre + "chainid2").val("");
          $("#" + me.pre + "structureid2").val("");

          // select residues
          //$(".ui-selected", this).each(function() {
              var id = $(this).attr('id');

              if(id !== undefined && id !== '') {
                  if(me.SELECT_RESIDUE === false) {

                        me.removeSeqChainBkgd();
                        me.removeSeqResidueBkgd();

                      me.icn3d.removeHighlightObjects();
                      me.icn3d.highlightAtoms = {};

                      me.SELECT_RESIDUE = true;
                      me.selectedResidues = {};
                      me.icn3d.highlightAtoms = {};

                      me.commanddesc = "seq_" + id.substr(id.indexOf('_') + 1);
                  }

                $(this).toggleClass('highlightSeq');

                var residueid = id.substr(id.indexOf('_') + 1);
                if($(this).hasClass('highlightSeq')) {
                  //atom.color = new THREE.Color(0xFFFF00);

                  me.selectAResidue(residueid, me.commanddesc);
                  me.selectedResidues[residueid] = 1;
                }

                for (var i in me.icn3d.residues[residueid]) {
                    var atom = me.icn3d.atoms[i];

                    if(!$(this).hasClass('highlightSeq')) {
                      //atom.color = me.icn3d.atomPrevColors[i];

                      delete me.icn3d.highlightAtoms[i];
                      me.selectedResidues[residueid] = undefined;
                    }
                }
              }
          //});

          var options2 = {};
          //options2['color'] = 'custom';

          //me.icn3d.draw(options2, false);
          me.icn3d.addHighlightObjects();
      });
    },

    selectChainMobile: function() { var me = this;
      $("#" + me.pre + "dl_sequence").on('click', '.seqTitle', function(e) {
          $("#" + me.pre + "chainid").val("");
          $("#" + me.pre + "structureid").val("");

          $("#" + me.pre + "chainid2").val("");
          $("#" + me.pre + "structureid2").val("");

            var currChain = $(this).attr('chain');

            me.SELECT_RESIDUE = false;
            me.setLogCommand('select residue ' + Object.keys(me.selectedResidues), true);

            me.removeSeqChainBkgd(currChain);
            me.removeSeqResidueBkgd();

            // select annotation title
            $(this).toggleClass('highlightSeq');

            var chainid = $(this).attr('chain');
            //var anno = $(this).attr('anno'); // annotation ids are from 0 to number of annotations. "anno" is "sequence" for the sequence line
            //var commanddesc = $(this).text() + " (" + chainid + ")";
            var commanddesc = "seq_" + $(this).text().trim();

            if($(this).hasClass('highlightSeq')) {
                me.selectAChain(chainid, commanddesc);
                me.setLogCommand('select chain ' + chainid, true);
            }
            else {
                me.icn3d.removeHighlightObjects();

                me.icn3d.highlightAtoms = {};

               $("#" + me.pre + "customResidues").val("");
               $("#" + me.pre + "customResidues2").val("");
               $("#" + me.pre + "customAtoms").val("");
            }
      });

      $("#" + me.pre + "dl_sequence2").on('click', '.seqTitle', function(e) {
          $("#" + me.pre + "chainid").val("");
          $("#" + me.pre + "structureid").val("");

          $("#" + me.pre + "chainid2").val("");
          $("#" + me.pre + "structureid2").val("");

            var currChain = $(this).attr('chain');

            //me.SELECT_RESIDUE = false;
            //me.setLogCommand('select residue ' + Object.keys(me.selectedResidues), true);

            me.removeSeqChainBkgd(currChain);
            me.removeSeqResidueBkgd();

            // select annotation title
            $(this).toggleClass('highlightSeq');

            var chainid = $(this).attr('chain');
            //var anno = $(this).attr('anno'); // annotation ids are from 0 to number of annotations. "anno" is "sequence" for the sequence line
            //var commanddesc = $(this).text() + " (" + chainid + ")";
            var commanddesc = "alignSeq_" + $(this).text().trim();

            if($(this).hasClass('highlightSeq')) {
                me.selectAAlignChain(chainid, commanddesc);
                me.setLogCommand('select alignChain ' + chainid, true);
            }
            else {
                me.icn3d.removeHighlightObjects();

                me.icn3d.highlightAtoms = {};

               $("#" + me.pre + "customResidues").val("");
               $("#" + me.pre + "customResidues2").val("");
               $("#" + me.pre + "customAtoms").val("");
            }
      });
    },

    clickStructureid: function() { var me = this;
        $("#" + me.pre + "structureid").change(function(e) {
           //e.preventDefault();

           var moleculeArray = $(this).val();
           $("#" + me.pre + "structureid2").val("");

           me.changeStructureid(moleculeArray);
        });

        $("#" + me.pre + "structureid2").change(function(e) {
           //e.preventDefault();

           var moleculeArray = $(this).val();
           $("#" + me.pre + "structureid").val("");

           me.changeStructureid(moleculeArray);
        });

        $("#" + me.pre + "structureid").focus(function(e) {
           //e.preventDefault();
           if(me.isMobile()) { // mobile has some problem in selecting
               $("#" + me.pre + "structureid").val("");
           }

           $(this).attr('size', $("#" + me.pre + "structureid option").length);
        });

        $("#" + me.pre + "structureid").blur(function(e) {
           //e.preventDefault();
           $(this).attr('size', 1);
        });
    },

    clickChainid: function() { var me = this;
        $("#" + me.pre + "chainid").change(function(e) {
           //e.preventDefault();

           var chainArray = $(this).val();
           $("#" + me.pre + "chainid2").val("");

           me.changeChainid(chainArray);
        });

        $("#" + me.pre + "chainid2").change(function(e) {
           //e.preventDefault();

           var chainArray = $(this).val();
           $("#" + me.pre + "chainid").val("");

           me.changeChainid(chainArray);
        });

        $("#" + me.pre + "chainid").focus(function(e) {
           //e.preventDefault();
           if(me.isMobile()) {
               $("#" + me.pre + "chainid").val("");
           }

           $(this).attr('size', $("#" + me.pre + "chainid option").length);
        });

        $("#" + me.pre + "chainid").blur(function(e) {
           //e.preventDefault();
           $(this).attr('size', 1);
        });
    },

    clickAlignChainid: function() { var me = this;
        $("#" + me.pre + "alignChainid").change(function(e) {
           //e.preventDefault();

           var alignChainArray = $(this).val();
           $("#" + me.pre + "alignChainid2").val();

           me.changeAlignChainid(alignChainArray);
        });

        $("#" + me.pre + "alignChainid2").change(function(e) {
           //e.preventDefault();

           var alignChainArray = $(this).val();
           $("#" + me.pre + "alignChainid").val();

           me.changeAlignChainid(alignChainArray);
        });

        $("#" + me.pre + "alignChainid").focus(function(e) {
           //e.preventDefault();
           if(me.isMobile()) {
               $("#" + me.pre + "alignChainid").val("");
           }

           $(this).attr('size', $("#" + me.pre + "alignChainid option").length);
        });

        $("#" + me.pre + "alignChainid").blur(function(e) {
           //e.preventDefault();
           $(this).attr('size', 1);
        });
    },

    clickCustomResidues: function() { var me = this;
        $("#" + me.pre + "customResidues").change(function(e) {
           //e.preventDefault();

           var nameArray = $(this).val();
           $("#" + me.pre + "customResidues2").val("");

           if(nameArray !== null) {
             // log the selection
             me.setLogCommand('select customresidues ' + nameArray.toString(), true);

             me.showCustomResidues(nameArray);
           }
        });

        $("#" + me.pre + "customResidues2").change(function(e) {
           //e.preventDefault();

           var nameArray = $(this).val();
           $("#" + me.pre + "customResidues").val("");

           if(nameArray !== null) {
             // log the selection
             me.setLogCommand('select customresidues ' + nameArray.toString(), true);

             me.showCustomResidues(nameArray);
           }
        });

        $("#" + me.pre + "customResidues").focus(function(e) {
           //e.preventDefault();
           if(me.isMobile()) {
               $("#" + me.pre + "customResidues").val("");
           }

           $(this).attr('size', $("#" + me.pre + "customResidues option").length);
        });

        $("#" + me.pre + "customResidues").blur(function(e) {
           //e.preventDefault();
           $(this).attr('size', 1);
        });
    },

    clickCustomAtoms: function() { var me = this;
        $("#" + me.pre + "customAtoms").change(function(e) {
           //e.preventDefault();

           var nameArray = $(this).val();

           if(nameArray !== null) {
             // log the selection
             me.setLogCommand('select customatoms ' + nameArray.toString(), true);

             me.showCustomAtoms(nameArray);
           }
        });

        $("#" + me.pre + "customAtoms").focus(function(e) {
           //e.preventDefault();
           if(me.isMobile()) $("#" + me.pre + "customAtoms").val("");
        });
    },

    clickShow_selected: function() { var me = this;
        $("#" + me.pre + "show_selected").add("#" + me.pre + "menu2_show_selected").click(function(e) {
    //       e.preventDefault();

           me.setLogCommand("show selected customResidues", true);

           if($("#" + me.pre + "alignChainid").length > 0 && $("#" + me.pre + "alignChainid").val() !== null) {
               me.showSelected(me.pre + "alignChainid");
           }
           else if($("#" + me.pre + "chainid").val() !== null || $("#" + me.pre + "customResidues").val() !== null) {
               me.showSelected(me.pre + "customResidues");
              }
        });
    },

    clickShow_sequences: function() { var me = this;
        $("#" + me.pre + "show_sequences").click(function(e) {
    //       e.preventDefault();

           if($("#" + me.pre + "alignChainid").length > 0) {
               me.openDialog(me.pre + 'dl_alignment', 'Select residues in aligned sequences');
           }
           else if($("#" + me.pre + "chainid").length > 0) {
               me.openDialog(me.pre + 'dl_selectresidues', 'Select residues in sequences with coordinates');
           }
        });
    },

    clickShow_selected_atom: function() { var me = this;
        $("#" + me.pre + "show_selected_atom").click(function(e) {
           e.preventDefault();

           me.setLogCommand("show selected customAtoms", true);
           me.showSelected(me.pre + "customAtoms");
        });
    },

    clickCommand_apply: function() { var me = this;
        $("#" + me.pre + "command_apply").click(function(e) {
           e.preventDefault();

           var select = $("#" + me.pre + "command").val();
           var commandname = $("#" + me.pre + "command_name").val();
           var commanddesc = $("#" + me.pre + "command_desc").val();

           me.setLogCommand('select ' + select + ' | name ' + commandname + ' | description ' + commanddesc, true);

           me.selectResiduesAtoms(select, commandname, commanddesc);
        });
    },

    clickReload_pdb: function() { var me = this;
        $("#" + me.pre + "reload_pdb").click(function(e) {
           e.preventDefault();

           dialog.dialog( "close" );

           me.setLogCommand("load pdb " + $("#" + me.pre + "pdbid").val(), false);

           // The following pdb info are required: 1. ATOM, 2. HETATM, 3. SHEET, 4. HELIX, 5. CONECT
           //me.downloadPdb($("#" + me.pre + "pdbid").val());

           window.open('//www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?pdbid=' + $("#" + me.pre + "pdbid").val(), '_blank');
        });
    },

    clickReload_mmcif: function() { var me = this;
        $("#" + me.pre + "reload_mmcif").click(function(e) {
           e.preventDefault();

           dialog.dialog( "close" );

           me.setLogCommand("load mmcif " + $("#" + me.pre + "mmcifid").val(), false);

           //me.downloadMmcif($("#" + me.pre + "mmcifid").val());
           window.open('//www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?mmcif=' + $("#" + me.pre + "mmcifid").val(), '_blank');
        });
    },

    clickReload_mmdb: function() { var me = this;
        $("#" + me.pre + "reload_mmdb").click(function(e) {
           e.preventDefault();

           dialog.dialog( "close" );

           me.setLogCommand("load mmdb " + $("#" + me.pre + "mmdbid").val(), false);

           //me.downloadMmdb($("#" + me.pre + "mmdbid").val());
           window.open('//www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?mmdbid=' + $("#" + me.pre + "mmdbid").val(), '_blank');
        });
    },

    clickReload_gi: function() { var me = this;
        $("#" + me.pre + "reload_gi").click(function(e) {
           e.preventDefault();

           dialog.dialog( "close" );

           me.setLogCommand("load gi " + $("#" + me.pre + "gi").val(), false);

           //me.downloadMmdb($("#" + me.pre + "mmdbid").val());
           window.open('//www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?gi=' + $("#" + me.pre + "gi").val(), '_blank');
        });
    },

    clickReload_cid: function() { var me = this;
        $("#" + me.pre + "reload_cid").click(function(e) {
           e.preventDefault();

           dialog.dialog( "close" );

           me.setLogCommand("load cid " + $("#" + me.pre + "cid").val(), false);

           //me.downloadCid($("#" + me.pre + "cid").val());
           window.open('//www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?cid=' + $("#" + me.pre + "cid").val(), '_blank');
        });
    },

    clickReload_state: function() { var me = this;
        $("#" + me.pre + "reload_state").click(function(e) {
           e.preventDefault();

           dialog.dialog( "close" );

           var file = $("#" + me.pre + "state")[0].files[0];

           if(!file) {
             alert("Please select a file before clicking 'Load'");
           }
           else {
             if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
                alert('The File APIs are not fully supported in this browser.');
             }

             var reader = new FileReader();
             reader.onload = function (e) {
               var dataStr = e.target.result; // or = reader.result;

               me.setLogCommand('load state file ' + file, false);

               me.loadStateFile(dataStr);
             };

             reader.readAsText(file);
           }

        });
    },

    clickReload_pdbfile: function() { var me = this;
        $("#" + me.pre + "reload_pdbfile").click(function(e) {
           e.preventDefault();

           dialog.dialog( "close" );

           var file = $("#" + me.pre + "pdbfile")[0].files[0];

           if(!file) {
             alert("Please select a file before clicking 'Load'");
           }
           else {
             if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
                alert('The File APIs are not fully supported in this browser.');
             }

             var reader = new FileReader();
             reader.onload = function (e) {
               var dataStr = e.target.result; // or = reader.result;

               me.setLogCommand('load pdb file ' + $("#" + me.pre + "pdbfile").val(), false);

               me.loadPdbData(dataStr);
             };

             reader.readAsText(file);
           }

        });
    },

    clickApplycustomcolor: function() { var me = this;
        $("#" + me.pre + "applycustomcolor").click(function(e) {
           e.preventDefault();
           dialog.dialog( "close" );

           me.setOption("color", $("#" + me.pre + "color").val());
           me.setLogCommand("color " + $("#" + me.pre + "color").val(), true);
        });
    },

    clickApplypick_aroundsphere: function() { var me = this;
        $("#" + me.pre + "applypick_aroundsphere").click(function(e) {
            e.preventDefault();

            dialog.dialog( "close" );
            var radius = $("#" + me.pre + "radius_aroundsphere").val();

               var select = "select aroundsphere | radius " + radius;
               me.setLogCommand(select, true);

               me.pickCustomSphere(select, radius);
        });
    },

    clickApplyhbonds: function() { var me = this;
        $("#" + me.pre + "applyhbonds").click(function(e) {
           e.preventDefault();
           dialog.dialog( "close" );

           var threshold = $("#" + me.pre + "hbondthreshold" ).val();

           var select = "show hbonds | threshold " + threshold;
           me.setLogCommand(select, true);

           me.showHbonds(select, threshold);
        });
    },

    clickApplypick_labels: function() { var me = this;
        $("#" + me.pre + "applypick_labels").click(function(e) {
           e.preventDefault();
           dialog.dialog( "close" );

           var text = $("#" + me.pre + "labeltext" ).val();
           var size = $("#" + me.pre + "labelsize" ).val();
           var color = $("#" + me.pre + "labelcolor" ).val();
           var background = $("#" + me.pre + "labelbkgd" ).val();

           if(me.icn3d.pickedatom === undefined || me.icn3d.pickedatom2 === undefined) {
             alert("Please pick another atom");
           }
           else {
             var x = (me.icn3d.pickedatom.coord.x + me.icn3d.pickedatom2.coord.x) / 2;
             var y = (me.icn3d.pickedatom.coord.y + me.icn3d.pickedatom2.coord.y) / 2;
             var z = (me.icn3d.pickedatom.coord.z + me.icn3d.pickedatom2.coord.z) / 2;

             me.setLogCommand('add label ' + text + ' | x ' + x  + ' y ' + y + ' z ' + z + ' | size ' + size + ' | color ' + color + ' | background ' + background, true);

             me.addLabel(text, x, y, z, size, color, background);

    //         me.icn3d.picking = 0;
             me.icn3d.pickpair = false;

             var options2 = {};
             options2['labels'] = 'yes';
             me.icn3d.draw(options2);
           }
        });
    },

    clickApplypick_measuredistance: function() { var me = this;
        $("#" + me.pre + "applypick_measuredistance").click(function(e) {
           e.preventDefault();
           dialog.dialog( "close" );

           if(me.icn3d.pickedatom === undefined || me.icn3d.pickedatom2 === undefined) {
             alert("Please pick another atom");
           }
           else {
             var distance = parseInt(me.icn3d.pickedatom.coord.distanceTo(me.icn3d.pickedatom2.coord) * 10) / 10;

             var text = distance.toString() + " A";

             var size, color, background;

             var x = (me.icn3d.pickedatom.coord.x + me.icn3d.pickedatom2.coord.x) / 2;
             var y = (me.icn3d.pickedatom.coord.y + me.icn3d.pickedatom2.coord.y) / 2;
             var z = (me.icn3d.pickedatom.coord.z + me.icn3d.pickedatom2.coord.z) / 2;

             me.setLogCommand('add label ' + text + ' | x ' + x  + ' y ' + y + ' z ' + z + ' | size ' + size + ' | color ' + color + ' | background ' + background, true);

             me.addLabel(text, x, y, z, size, color, background);

             var color = "#FFFF00";
             var dashed = true;

             me.setLogCommand('add line | x1 ' + me.icn3d.pickedatom.coord.x  + ' y1 ' + me.icn3d.pickedatom.coord.y + ' z1 ' + me.icn3d.pickedatom.coord.z + ' | x2 ' + me.icn3d.pickedatom2.coord.x  + ' y2 ' + me.icn3d.pickedatom2.coord.y + ' z2 ' + me.icn3d.pickedatom2.coord.z + ' | color ' + color + ' | dashed ' + dashed, true);

             me.addLine(me.icn3d.pickedatom.coord.x, me.icn3d.pickedatom.coord.y, me.icn3d.pickedatom.coord.z, me.icn3d.pickedatom2.coord.x, me.icn3d.pickedatom2.coord.y, me.icn3d.pickedatom2.coord.z, color, dashed);

    //         me.icn3d.picking = 0;
             me.icn3d.pickpair = false;

             var options2 = {};
             options2['labels'] = 'yes';
             options2['lines'] = 'yes';
             me.icn3d.draw(options2);
           }
        });
    },

    clickReset: function() { var me = this;
        $("#" + me.pre + "reset").click(function (e) {
            e.preventDefault();

            me.setLogCommand("reset", true);

            me.show3DStructure();
        });
    },

    clickToggleHighlight: function() { var me = this;
        $("#" + me.pre + "toggleHighlight").add("#" + me.pre + "toggleHighlight2").click(function (e) {
    //        e.preventDefault();

            me.setLogCommand("toggle highlight", true);

            if(me.icn3d.prevHighlightObjects.length > 0) { // remove
                me.icn3d.removeHighlightObjects();
            }
            else { // add
                me.icn3d.addHighlightObjects();
                //me.icn3d.applyTransformation(me.icn3d._zoomFactor, me.icn3d.mouseChange, me.icn3d.quaternion);
            }
        });
    },

    pressCommandtext: function() { var me = this;
        //$("#" + me.pre + "commandtext").keypress(function(e){
        $("#" + me.pre + "logtext").keypress(function(e){
           //e.preventDefault();

           var code = (e.keyCode ? e.keyCode : e.which);

           if(code == 13) { //Enter keycode
              e.preventDefault();

              var dataStr = $(this).val();

              me.icn3d.bRender = true;

              var commandArray = dataStr.split('\n');
              var lastCommand = commandArray[commandArray.length - 1].substr(2); // skip "> "
              me.icn3d.logs.push(lastCommand);
              $("#" + me.pre + "logtext").val("> " + me.icn3d.logs.join("\n> ") + "\n> ").scrollTop($("#" + me.pre + "logtext")[0].scrollHeight);

              if(lastCommand !== '') {
                  var transformation = {};
                  transformation.factor = me.icn3d._zoomFactor;
                  transformation.mouseChange = me.icn3d.mouseChange;
                  transformation.quaternion = me.icn3d.quaternion;
                  //me.icn3d.transformation.push(transformation);

                me.icn3d.commands.push(lastCommand + '|||' + JSON.stringify(transformation));

                me.applyCommand(lastCommand + '|||' + JSON.stringify(transformation));

                //me.renderStructure(true);
                me.icn3d.draw();
              }
           }
        });
    },

    clickFilter_ckbx_all: function() { var me = this;
        $("#" + me.pre + "filter_ckbx_all").click(function (e) {
           //e.preventDefault();

           var ckbxes = document.getElementsByName(me.pre + "filter_ckbx");

           if($(this)[0].checked == true) {
             for(var i = 0, il = ckbxes.length; i < il; ++i) { // skip the first "all" checkbox
               ckbxes[i].checked = true;
             }
           }
           else {
             for(var i = 0, il = ckbxes.length; i < il; ++i) { // skip the first "all" checkbox
               ckbxes[i].checked = false;
             }
           }
        });
    },

    clickFilter: function() { var me = this;
        $("#" + me.pre + "filter").click(function (e) {
           //e.preventDefault();

           var ckbxes = document.getElementsByName(me.pre + "filter_ckbx");

           var mols = "";

           var ligandFlag = "&het=0";
           for(var i = 0, il = ckbxes.length; i < il; ++i) { // skip the first "all" checkbox
             if(ckbxes[i].checked) {
                 if(ckbxes[i].value == 'ligands') {
                     ligandFlag = "&het=2";
                 }
                 else {
                     mols += ckbxes[i].value + ",";
                  }
             }
           }

           // have to choose one
           if(mols == "") {
               mols = ckbxes[0].value
           }

           var url = document.URL + "&mols=" + mols + "&complexity=2" + ligandFlag;

           window.open(url, '_self');
        });
    },

    clickLabel_3d_diagram: function() { var me = this;
        $("#" + me.pre + "label_3d_diagram").click(function (e) {
           //e.preventDefault();

           var ckbxes = document.getElementsByName(me.pre + "filter_ckbx");

           var mols = "";

           var labels = [];

           for(var i = 0, il = ckbxes.length; i < il; ++i) { // skip the first "all" checkbox
             if(ckbxes[i].checked) {
               if(ckbxes[i].value != 'ligands') labels.push(me.icn3d.savedLabels[ckbxes[i].value]);
             }
           }

           me.icn3d.labels = labels;

           me.icn3d.createLabelRepresentation(me.icn3d.labels);

           me.icn3d.render();
        });
    },

    clickStopSelection: function() { var me = this;
        $(document).on("click", "." + me.pre + "stopselection", function(e) {
           //e.preventDefault();

            me.SELECT_RESIDUE = false;
            me.setLogCommand('select residue ' + Object.keys(me.selectedResidues), true);
        });
    },

    bindMouseup: function() { var me = this;
        $("accordion").bind('mouseup touchend', function (e) {
          if(me.icn3d.controls) {
            me.icn3d.controls.noRotate = false;
            me.icn3d.controls.noZoom = false;
            me.icn3d.controls.noPan = false;
          }
        });
    },

    bindMousedown: function() { var me = this;
        $("accordion").bind('mousedown touchstart', function (e) {
          if(me.icn3d.controls) {
            me.icn3d.controls.noRotate = true;
            me.icn3d.controls.noZoom = true;
            me.icn3d.controls.noPan = true;
          }
        });
    },

    windowResize: function() { var me = this;
        if(me.cfg.resize !== undefined && me.cfg.resize && !me.isMobile() ) {
            $(window).resize(function() {
                var width = $( window ).width() - me.LESSWIDTH;
                var height = $( window ).height() - me.LESSHEIGHT;

                me.resizeCanvas(width, height);
            });
        }
    },

    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    isMac: function() {
        return /Mac/i.test(navigator.userAgent);
    },

    isSessionStorageSupported: function() {
      var testKey = 'test';
      try {
        sessionStorage.setItem(testKey, '1');
        sessionStorage.removeItem(testKey);
        return true;
      } catch (error) {
        return false;
      }
    },

    saveCommandsToSession: function() { var me = this;
        var dataStr = me.icn3d.commands.join('\n');
        var data = decodeURIComponent(dataStr);

        sessionStorage.setItem('commands', data);
    },

    //http://jasonjl.me/blog/2015/06/21/taking-action-on-browser-crashes/
    getCommandsBeforeCrash: function() { var me = this;
       window.addEventListener('load', function () {
          sessionStorage.setItem('good_exit', 'pending');
          //setInterval(function () {
          //     sessionStorage.setItem('time_before_crash', new Date().toString());
          //}, 1000);
       });

       window.addEventListener('beforeunload', function () {
          sessionStorage.setItem('good_exit', 'true');
       });

       if(sessionStorage.getItem('good_exit') && sessionStorage.getItem('good_exit') !== 'true') {
          me.CRASHED = true;
          me.commandsBeforeCrash = sessionStorage.getItem('commands');
       }
    },

    // ===== events end
    allEventFunctions: function() { var me = this;
        if(! me.isMobile()) {
            me.selectSequenceNonMobile();
        }
        else {
            me.selectSequenceMobile();
            me.selectChainMobile();
        }

        me.clickBack();
        me.clickForward();
        me.clickToggle();

        me.clickHlColorYellow();
        me.clickHlColorGreen();
        me.clickHlColorRed();
        me.clickHlStyleOutline();
        me.clickHlStyleObject();

        me.clickAlternate();
        me.clickMenu1_pdbid();
        me.clickMenu1_pdbfile();
        me.clickMenu1_mmcifid();
        me.clickMenu1_mmdbid();
        me.clickMenu1_gi();
        me.clickMenu1_cid();
        me.clickMenu1_state();
        me.clickMenu1_exportState();
        me.clickMenu1_exportCanvas();
        me.clickMenu1_link_structure();
        me.clickMenu1_link_vast();
        me.clickMenu1_link_pubmed();
        me.clickMenu2_selectresidues();
        me.clickMenu2_selectcomplement();
        me.clickMenu2_selectall();
        me.clickMenu2_alignment();
        me.clickMenu2_command();
        me.clickMenu2_pickingYes();
        me.clickMenu2_pickingNo();
        me.clickMenu2_pickingResidue();
        me.clickMenu2_aroundsphere();
        me.clickMenu2_select_chain();
        me.clickMenu3_proteinRibbon();
        me.clickMenu3_proteinStrand();
        me.clickMenu3_proteinCylinder();
        me.clickMenu3_proteinCalpha();
        me.clickMenu3_proteinBfactor();
        me.clickMenu3_proteinLines();
        me.clickMenu3_proteinStick();
        me.clickMenu3_proteinBallstick();
        me.clickMenu3_proteinSphere();
        me.clickMenu3_proteinNothing();
        me.clickmenu3_nuclCartoon();
        me.clickmenu3_nuclPhos();
        me.clickmenu3_nuclLines();
        me.clickmenu3_nuclStick();
        me.clickmenu3_nuclBallstick();
        me.clickmenu3_nuclSphere();
        me.clickmenu3_nuclNothing();
        me.clickMenu3_ligandsLines();
        me.clickMenu3_ligandsStick();
        me.clickMenu3_ligandsBallstick();
        me.clickMenu3_ligandsSphere();
        me.clickMenu3_ligandsNothing();
        me.clickMenu3_ionsSphere();
        me.clickMenu3_ionsDot();
        me.clickMenu3_ionsNothing();
        me.clickMenu3_waterSphere();
        me.clickMenu3_waterDot();
        me.clickMenu3_waterNothing();
        me.clickMenu4_colorSpectrum();
        me.clickMenu4_colorChain();
        me.clickMenu4_colorSS();
        me.clickMenu4_colorBfactor();
        me.clickMenu4_colorResidue();
        me.clickMenu4_colorPolarity();
        me.clickMenu4_colorAtom();
        me.clickMenu4_colorRed();
        me.clickMenu4_colorGreen();
        me.clickMenu4_colorBlue();
        me.clickMenu4_colorMagenta();
        me.clickMenu4_colorYellow();
        me.clickMenu4_colorCyan();
        me.clickMenu4_colorWhite();
        me.clickMenu4_colorGrey();
        me.clickMenu4_colorCustom();
        me.clickMenu5_showsurfaceYes();
        me.clickMenu5_showsurfaceNo();
        me.clickMenu5_surfaceVDW();
        me.clickMenu5_surfaceSES();
        me.clickMenu5_surfaceSAS();
        me.clickMenu5_surfaceSAS();
        me.clickMenu5_surfaceNothing();
        me.clickMenu5_opacity10();
        me.clickMenu5_opacity09();
        me.clickMenu5_opacity08();
        me.clickMenu5_opacity07();
        me.clickMenu5_opacity06();
        me.clickMenu5_opacity05();
        me.clickMenu5_wireframeYes();
        me.clickMenu5_wireframeNo();
        me.clickMenu6_assemblyYes();
        me.clickMenu6_assemblyNo();
        me.clickMenu6_addlabelYes();
        me.clickMenu6_addlabelNo();
        me.clickMenu6_distanceYes();
        me.clickMenu6_distanceNo();
        me.clickMenu6_selectedcenter();
        me.clickMenu6_rotateleft();
        me.clickMenu6_rotateright();
        me.clickMenu6_rotateup();
        me.clickMenu6_rotatedown();
        me.clickMenu6_cameraPers();
        me.clickMenu6_cameraOrth();
        me.clickMenu6_bkgdBlack();
        me.clickMenu6_bkgdGrey();
        me.clickMenu6_bkgdWhite();
        me.clickMenu6_showaxisYes();
        me.clickMenu6_showaxisNo();
        me.clickMenu6_hbondsYes();
        me.clickMenu6_hbondsNo();
        me.clickStructureid();
        me.clickChainid();
        me.clickAlignChainid();
        me.clickCustomResidues();
        me.clickCustomAtoms();
        me.clickShow_selected();
        me.clickShow_sequences();
        me.clickShow_selected_atom();
        me.clickCommand_apply();
        me.clickReload_pdb();
        me.clickReload_pdbfile();
        me.clickReload_mmcif();
        me.clickReload_mmdb();
        me.clickReload_gi();
        me.clickReload_cid();
        me.clickReload_state();
        me.clickApplycustomcolor();
        me.clickApplypick_aroundsphere();
        me.clickApplyhbonds();
        me.clickApplypick_labels();
        me.clickApplypick_measuredistance();
        me.clickReset();
        me.clickToggleHighlight();
        me.pressCommandtext();
        me.clickFilter_ckbx_all();
        me.clickFilter();
        me.clickLabel_3d_diagram();
        me.clickStopSelection();
        me.bindMouseup();
        me.bindMousedown();
        me.windowResize();
    }
  };
