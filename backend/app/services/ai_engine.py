# AI Content Engine — Multi-Provider Support (Claude default, OpenAI alternative)
import json
from typing import List, Dict, Optional
from openai import OpenAI
from anthropic import Anthropic
from ..config import settings

# Initialize clients
openai_client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
anthropic_client = Anthropic(api_key=settings.claude_api_key) if settings.claude_api_key else None


class AIContentEngine:
    """
    Prompt-chained AI engine for generating platform-specific content.

    Supports Claude (default) and OpenAI (alternative).

    Chain:
    1. Analyze source → extract metadata
    2. Identify viral angles
    3. Generate per platform
    4. Rewrite to brand voice
    """

    def __init__(self, workspace_profile: Dict):
        self.workspace = workspace_profile
        self.forbidden_words = workspace_profile.get("forbidden_words", [])
        self.brand_voice = workspace_profile.get("brand_voice", "")
        self.brand_colors = workspace_profile.get("brand_colors", [])
        self.cta_style = workspace_profile.get("cta_style", "")
        self.content_pillars = workspace_profile.get("content_pillars", [])
        self.target_audience = workspace_profile.get("target_audience", "")
        self.provider = settings.ai_provider

    def _call_ai(self, system: str, user: str, temperature: float = 0.7) -> str:
        """Make AI call based on configured provider"""
        if self.provider == "claude":
            return self._call_claude(system, user, temperature)
        else:
            return self._call_openai(system, user, temperature)

    def _call_claude(self, system: str, user: str, temperature: float = 0.7) -> str:
        """Call Claude API"""
        if not anthropic_client:
            raise ValueError("Claude API key not configured. Set CLAUDE_API_KEY in .env")

        response = anthropic_client.messages.create(
            model=settings.claude_model,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": user}],
            temperature=temperature
        )
        return response.content[0].text

    def _call_openai(self, system: str, user: str, temperature: float = 0.7) -> str:
        """Call OpenAI API"""
        if not openai_client:
            raise ValueError("OpenAI API key not configured. Set OPENAI_API_KEY in .env")

        response = openai_client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ],
            temperature=temperature
        )
        return response.choices[0].message.content

    def _sanitize_output(self, text: str) -> str:
        """Remove forbidden words from generated content"""
        result = text
        for word in self.forbidden_words:
            result = result.replace(word, "[REDACTED]")
        return result

    def analyze_source(self, content: str) -> Dict:
        """Prompt 1: Analyze and extract metadata"""
        prompt = f"""You are a content strategist analyzing source material for social media campaigns.

SOURCE CONTENT:
{content}

ANALYSIS REQUIRED:
Return a JSON object with:
- "topic": Main topic/theme (1-3 words)
- "keywords": Top 5 keywords extracted
- "angle": The unique angle or perspective
- "emotional_hook": Primary emotional appeal (fear, joy, ambition, belonging, etc.)
- "cta_possibilities": 3 possible calls-to-action
- "content_type": "educational", "entertaining", "inspirational", or "promotional"
- "target_mood": The mood this content should evoke

Only respond with valid JSON. No markdown, no explanation."""

        response = self._call_ai(
            system="You are an expert content strategist. Always output valid JSON.",
            user=prompt,
            temperature=0.7
        )

        try:
            return json.loads(response)
        except:
            return {
                "topic": "general",
                "keywords": [],
                "angle": "insightful",
                "emotional_hook": "curiosity",
                "cta_possibilities": ["Learn more", "Discover now", "Get started"],
                "content_type": "educational",
                "target_mood": "engaged"
            }

    def identify_viral_angles(self, content: str, metadata: Dict) -> List[str]:
        """Prompt 2: Identify viral angles"""
        prompt = f"""You are a viral content specialist.

SOURCE: {content}

METADATA:
- Topic: {metadata.get('topic', 'general')}
- Angle: {metadata.get('angle', 'insightful')}
- Emotional Hook: {metadata.get('emotional_hook', 'curiosity')}

Generate 6 viral angles for this content. Each angle should:
1. Be a complete hook statement (not just a topic)
2. Work as a standalone social media post opener
3. Be platform-appropriate for Instagram/Facebook

Return a JSON array of 6 angle strings. Example:
["Did you know this one habit changes everything...", "The secret most experts won't tell you about...", etc.]

Only output valid JSON array."""

        response = self._call_ai(
            system="You are a viral content specialist. Always output valid JSON array.",
            user=prompt,
            temperature=0.9
        )

        try:
            return json.loads(response)
        except:
            return ["Share this with someone who needs it", "Here's what most people miss...", "The truth about..."]

    def generate_for_platform(
        self,
        content: str,
        metadata: Dict,
        angles: List[str],
        platform: str,
        content_type: str = "caption"
    ) -> List[str]:
        """Prompt 3: Generate platform-specific content"""

        platform_configs = {
            "instagram": {
                "max_length": 2200,
                "style": "conversational, use line breaks, include CTA at end, can use emoji",
                "hashtag_suggestion": "Include 5-8 relevant hashtags at the end"
            },
            "facebook": {
                "max_length": 500,
                "style": "engaging intro, value proposition, community-focused CTA",
                "hashtag_suggestion": "Include 2-3 hashtags if relevant"
            },
            "linkedin": {
                "max_length": 3000,
                "style": "professional insights, data-backed claims, thought leadership tone",
                "hashtag_suggestion": "Include 3-5 professional hashtags"
            },
            "twitter": {
                "max_length": 280,
                "style": "concise, hook first, value-driven, conversational",
                "hashtag_suggestion": "Include 1-2 hashtags"
            }
        }

        config = platform_configs.get(platform.lower(), platform_configs["instagram"])

        prompt = f"""You are a social media content creator for {platform}.

BRAND VOICE: {self.brand_voice}
TARGET AUDIENCE: {self.target_audience}
CONTENT PILLARS: {', '.join(self.content_pillars)}
CTA STYLE: {self.cta_style}

SOURCE CONTENT: {content}

METADATA:
- Topic: {metadata.get('topic', 'general')}
- Angle: {metadata.get('angle', 'insightful')}
- Content Type: {metadata.get('content_type', 'educational')}

VIABLE ANGLES:
{chr(10).join([f"{i+1}. {a}" for i, a in enumerate(angles[:3])])}

Generate {content_type} options following these rules:
- Max {config['max_length']} characters
- Style: {config['style']}
- {config['hashtag_suggestion']}
- NEVER use forbidden words: {', '.join(self.forbidden_words) if self.forbidden_words else 'none'}
- Each option should be DIFFERENT from the others (different angle, different structure)

Return a JSON array of 3 distinct {content_type} options for {platform}."""

        response = self._call_ai(
            system="You are a social media expert. Always output valid JSON array.",
            user=prompt,
            temperature=0.85
        )

        try:
            outputs = json.loads(response)
            return [self._sanitize_output(o) for o in outputs]
        except:
            return [f"Check out this content about {metadata.get('topic', 'our latest')}: {content[:100]}..."]

    def rewrite_to_brand(self, content: str) -> str:
        """Prompt 4: Rewrite to exact brand voice"""
        prompt = f"""Rewrite this content to match the brand voice exactly.

BRAND VOICE: {self.brand_voice}
CTA STYLE: {self.cta_style}
FORBIDDEN WORDS: {', '.join(self.forbidden_words) if self.forbidden_words else 'none'}

CONTENT TO REWRITE:
{content}

Return only the rewritten content. No explanation, no quotes, just the content."""

        response = self._call_ai(
            system="You are a brand voice expert. Return only rewritten content.",
            user=prompt,
            temperature=0.7
        )

        return self._sanitize_output(response.strip())

    def generate_batch(
        self,
        content: str,
        platforms: Optional[List[str]] = None,
        content_types: Optional[List[str]] = None
    ) -> Dict:
        """
        Main method — runs full prompt chain and returns batch output.
        """
        if platforms is None:
            platforms = ["instagram", "facebook", "linkedin", "twitter"]

        if content_types is None:
            content_types = ["caption"]

        # Step 1: Analyze
        metadata = self.analyze_source(content)

        # Step 2: Identify angles
        angles = self.identify_viral_angles(content, metadata)

        # Step 3: Generate per platform
        results = {
            "metadata": metadata,
            "angles": angles,
            "content": {}
        }

        for platform in platforms:
            results["content"][platform] = {}
            for ctype in content_types:
                raw_outputs = self.generate_for_platform(
                    content, metadata, angles, platform, ctype
                )
                # Step 4: Rewrite each to brand voice
                brand_rewritten = [self.rewrite_to_brand(o) for o in raw_outputs]
                results["content"][platform][ctype] = brand_rewritten

        return results


def generate_content(workspace_profile: Dict, content: str, platforms: List[str]) -> Dict:
    """Convenience function to run the full content generation chain"""
    engine = AIContentEngine(workspace_profile)
    return engine.generate_batch(content, platforms=platforms)