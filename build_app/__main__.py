"""
Create and save a favicon with centered text using PIL.

"""

from __future__ import annotations

import logging
from dataclasses import dataclass, replace
from pathlib import Path

import toml
from PIL import Image, ImageDraw, ImageFont

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)


class ConfigLoadError(Exception):
    """Custom exception for configuration loading errors."""


@dataclass
class FaviconConfig:  # pylint: disable=too-many-instance-attributes
    """Configuration for the favicon generator."""

    text: str
    font_path: Path
    text_color: float | tuple[float, ...] | str
    background_color: float | tuple[float, ...] | str
    write_to: Path

    favicon_dim: int = 64
    text_to_image_ratio: float = 2 / 3
    high_rez_scale_factor: int = 7

    def __post_init__(self):
        """Automatically called after the dataclass is initialized to validate fields."""
        self.validate()

    @classmethod
    def from_toml(cls, filepath: str | Path) -> FaviconConfig:
        """Load configuration from a TOML file or section in pyproject.toml."""
        config_file = Path(filepath)
        config_data = {}

        if not config_file.exists():
            raise FileNotFoundError(f"Configuration file not found at '{config_file}'")

        try:
            with config_file.open("r", encoding="utf-8") as f:
                toml_content = toml.load(f)
                tool_data: dict = toml_content.get("tool", {})
                rh1_data: dict = tool_data.get("rh1", {})
                config_data: dict = rh1_data.get("favicon", {})
        except (TypeError, toml.TomlDecodeError, FileNotFoundError, IOError) as err:
            raise ConfigLoadError(f"Failed to load or parse TOML file at '{config_file}'") from err

        try:
            required_fields = {
                "text": config_data.pop("text"),
                "font_path": Path.cwd() / config_data.pop("font"),
                "text_color": config_data.pop("primary_color"),
                "background_color": config_data.pop("secondary_color"),
                "write_to": Path.cwd() / config_data.pop("write_to"),
            }
        except KeyError as missing_key:
            raise ValueError("Missing required configuration option") from missing_key

        default_config = cls(**required_fields)

        optional_fields = {k: v for k, v in config_data.items() if k not in required_fields}
        config = replace(default_config, **optional_fields)

        return config

    def validate(self) -> None:
        """Validate the user-provided or default inputs."""
        if not 16 <= self.favicon_dim <= 64:
            raise ValueError("Favicon dimension must be between 16 and 64")
        if not 0 < self.text_to_image_ratio <= 1:
            raise ValueError("Text to image ratio must be between 0 and 1")
        if not 0 < self.high_rez_scale_factor <= 7:
            raise ValueError("Scale factor must be between 0 and 7")
        if self.write_to.suffix != ".ico":
            raise ValueError("Filename must end with .ico")
        if not self.font_path.exists():
            raise FileNotFoundError(f"Font file not found at {self.font_path}")


def create_image(config: FaviconConfig, image_size: tuple[int, int]) -> Image.Image:
    """Create the high-resolution image with centered text."""
    high_res_image = Image.new("RGBA", image_size, config.background_color)
    draw = ImageDraw.Draw(high_res_image)

    font_size = int(image_size[0] * config.text_to_image_ratio)
    font = ImageFont.truetype(str(config.font_path), size=font_size)

    x = image_size[0] // 2
    y = image_size[1] // 2

    draw.text((x, y), config.text, font=font, fill=config.text_color, anchor="mm")

    return high_res_image


def create_favicon(config: FaviconConfig) -> None:
    """Main function to create a favicon with optional inputs."""
    high_res_dim = config.favicon_dim * 2**config.high_rez_scale_factor
    high_res_image = create_image(config, (high_res_dim, high_res_dim))
    favicon_image = high_res_image.resize((config.favicon_dim, config.favicon_dim), resample=1)

    config.write_to.parent.mkdir(parents=True, exist_ok=True)

    favicon_image.save(str(config.write_to))
    print(f"Favicon saved to '{config.write_to}'")


def main():
    path_to_pyproject = Path.cwd() / "pyproject.toml"
    favicon_config = FaviconConfig.from_toml(path_to_pyproject)
    create_favicon(favicon_config)


if __name__ == "__main__":
    main()
