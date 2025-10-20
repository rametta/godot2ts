extends RefCounted
class_name CameraShakeCore

@export var default_intensity := 20.0
@export var default_speed     := 25.0
@export var default_duration  := 0.40
@export var default_fade_in   := 0.05
@export var default_fade_out  := 0.10

var _active     : bool  = false
var _t          : float = 0.0
var _duration   : float = 0.0
var _intensity  : float = 0.0
var _speed      : float = 0.0
var _fade_in    : float = 0.0
var _fade_out   : float = 0.0
var _noise_time : float = 0.0
var _noise      : FastNoiseLite
var _base_pos   : Vector2 = Vector2.ZERO

var _host_weak  : WeakRef
var _bound      : bool = false
var _last_usec  : int  = 0

func _init() -> void:
  pass

func bind(other, host: Node2D, process_during_pause := true, last: bool := true) -> void:
  pass

func unbind() -> void:
  pass

func _on_process_frame() -> void:
  pass

func shake(
  intensity : float = default_intensity,
  speed     : float = default_speed,
  duration  : float = default_duration,
  fade_in   : float = default_fade_in,
  fade_out  : float = default_fade_out,
  additive  : bool  = false
) -> void:
  pass

func stop() -> void:
  pass

func is_active() -> bool:
  pass
